#!/usr/bin/env bash
# Phase 1 security hardening for the worlddigital.ai Google Cloud project (see docs/development-roadmap, B-02 B-03 B-04).
# Run in Google Cloud Shell, signed in as the project owner (and a billing account admin for the budget):
#   bash phase1-hardening.sh            # apply everything (safe to run again)
#   bash phase1-hardening.sh rollback   # give github-deploy its old broad roles back if a deploy fails
#
# What it does:
#   1. Monthly billing budget with email alerts at 50%, 90%, 100% and forecast 100%.
#   2. Lets the deploy workflow keep the INTERNAL_TOKEN and RESEND_API_KEY secrets in sync with GitHub,
#      so Cloud Run reads them from Secret Manager instead of plain environment variables.
#   3. Creates a read-only account for the weekly site audit (BigQuery read only).
#   4. Replaces github-deploy's project-wide admin roles with roles limited to what the deploy touches.
# It never prints secret values and never deletes anything except the four broad role bindings in step 4.
set -euo pipefail

P=cs-poc-0zqkvyxapah85tnxz2byzqa
N=250920469327
REGION=us-central1
SERVICE=worlddigital-ai-api
REPO=WorldDigitalai/worlddigital-ai
DEPLOY_SA=github-deploy@$P.iam.gserviceaccount.com
RUNTIME_SA=$N-compute@developer.gserviceaccount.com
LEGACY_BUILD_SA=$N@cloudbuild.gserviceaccount.com
AUDIT_SA_NAME=site-audit-reader
AUDIT_SA=$AUDIT_SA_NAME@$P.iam.gserviceaccount.com
WIF_MEMBER="principalSet://iam.googleapis.com/projects/$N/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"
BROAD_ROLES=(run.admin storage.admin artifactregistry.admin iam.serviceAccountUser)

gcloud config set project "$P" >/dev/null
q() { "$@" --quiet >/dev/null; }

if [ "${1:-}" = "rollback" ]; then
  echo "Rollback: restoring github-deploy's previous project-wide roles…"
  for r in "${BROAD_ROLES[@]}"; do
    q gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$DEPLOY_SA" --role="roles/$r" --condition=None
    echo "   restored roles/$r"
  done
  echo "Done. Re-run the 'Deploy tools API' workflow and tell Claude what failed."
  exit 0
fi

echo "1/4 Billing budget…"
q gcloud services enable billingbudgets.googleapis.com cloudbilling.googleapis.com
BA=$(gcloud billing projects describe "$P" --format='value(billingAccountName)' | sed 's#billingAccounts/##')
if [ -z "$BA" ]; then
  echo "   No billing account linked to $P; skipped."
elif gcloud billing budgets list --billing-account="$BA" --format='value(displayName)' 2>/dev/null | grep -qx "worlddigital monthly"; then
  echo "   Budget 'worlddigital monthly' already exists, kept."
else
  read -rp "   Monthly budget in USD [50]: " AMT; AMT=${AMT:-50}
  q gcloud billing budgets create --billing-account="$BA" --display-name="worlddigital monthly" \
    --budget-amount="${AMT}USD" --filter-projects="projects/$P" \
    --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 \
    --threshold-rule=percent=1.0,basis=forecasted-spend
  echo "   Budget created: \$$AMT/month. Alerts email the billing account admins."
fi

echo "2/4 Secret sync permissions for the deploy workflow…"
for s in INTERNAL_TOKEN RESEND_API_KEY; do
  gcloud secrets describe "$s" >/dev/null 2>&1 || { echo "   Secret $s is missing. Run backend/setup-gcp.sh first."; exit 1; }
  for r in secretmanager.secretAccessor secretmanager.secretVersionAdder; do
    q gcloud secrets add-iam-policy-binding "$s" --member="serviceAccount:$DEPLOY_SA" --role="roles/$r"
  done
  echo "   github-deploy can read and add versions of $s (this secret only)"
done

echo "3/4 Read-only account for the weekly site audit…"
gcloud iam service-accounts describe "$AUDIT_SA" >/dev/null 2>&1 || \
  q gcloud iam service-accounts create "$AUDIT_SA_NAME" --display-name="Site audit (BigQuery read-only)"
q gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$AUDIT_SA" --role=roles/bigquery.jobUser --condition=None
if ! bq add-iam-policy-binding --member="serviceAccount:$AUDIT_SA" --role=roles/bigquery.dataViewer "$P:searchconsole_worlddigitalai" >/dev/null 2>&1; then
  echo "   (dataset-level grant not supported by this bq version; using project-level BigQuery Data Viewer)"
  q gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$AUDIT_SA" --role=roles/bigquery.dataViewer --condition=None
fi
q gcloud iam service-accounts add-iam-policy-binding "$AUDIT_SA" --role=roles/iam.workloadIdentityUser --member="$WIF_MEMBER"
echo "   $AUDIT_SA: run BigQuery jobs + read Search Console data. Nothing else."

echo "4/4 Narrowing github-deploy to what the deploy needs…"
# Add the narrow roles first, so there is never a moment without permission.
q gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$DEPLOY_SA" --role=roles/run.developer --condition=None
q gcloud run services add-iam-policy-binding "$SERVICE" --region="$REGION" --member="serviceAccount:$DEPLOY_SA" --role=roles/run.admin
echo "   run: developer on the project, admin on $SERVICE only (needed for public access setting)"
for sa in "$RUNTIME_SA" "$LEGACY_BUILD_SA"; do
  if gcloud iam service-accounts describe "$sa" >/dev/null 2>&1; then
    q gcloud iam service-accounts add-iam-policy-binding "$sa" --member="serviceAccount:$DEPLOY_SA" --role=roles/iam.serviceAccountUser
    echo "   can act as $sa only"
  fi
done
BUCKETS=$(gcloud storage buckets list --format='value(name)' | grep -E "^(run-sources-$P-$REGION|${P}_cloudbuild)$" || true)
if [ -z "$BUCKETS" ]; then
  echo "   Source-upload buckets not found; keeping roles/storage.admin to avoid breaking deploys."
  KEEP_STORAGE=1
else
  for b in $BUCKETS; do
    q gcloud storage buckets add-iam-policy-binding "gs://$b" --member="serviceAccount:$DEPLOY_SA" --role=roles/storage.admin
    echo "   storage admin on gs://$b only"
  done
fi
AR_REPO=$(gcloud artifacts repositories list --location="$REGION" --format='value(name)' 2>/dev/null | grep -E '/cloud-run-source-deploy$' || true)
if [ -n "$AR_REPO" ]; then
  q gcloud artifacts repositories add-iam-policy-binding cloud-run-source-deploy --location="$REGION" \
    --member="serviceAccount:$DEPLOY_SA" --role=roles/artifactregistry.writer
  echo "   artifact writer on cloud-run-source-deploy only"
else
  q gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$DEPLOY_SA" --role=roles/artifactregistry.writer --condition=None
  echo "   artifact writer on the project (repository not found by name)"
fi
# Then remove the broad ones.
for r in "${BROAD_ROLES[@]}"; do
  [ "$r" = storage.admin ] && [ "${KEEP_STORAGE:-}" = 1 ] && continue
  gcloud projects remove-iam-policy-binding "$P" --member="serviceAccount:$DEPLOY_SA" --role="roles/$r" --condition=None --quiet >/dev/null 2>&1 \
    && echo "   removed project-wide roles/$r" || echo "   roles/$r was not set project-wide"
done

echo
echo "Done. Tell Claude 'gcp done'. It will merge the workflow change, run one deploy and check it."
echo "If that deploy fails on a permission error: bash phase1-hardening.sh rollback"
