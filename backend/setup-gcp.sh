#!/usr/bin/env bash
# One-time Google Cloud setup for the worlddigital.ai tools API.
# Run in Google Cloud Shell (console.cloud.google.com → >_ icon), signed in as the project owner:
#   bash setup-gcp.sh
# Safe to run again: existing pieces are kept; it only asks for secrets that don't exist yet.
set -euo pipefail

P=cs-poc-0zqkvyxapah85tnxz2byzqa
N=250920469327
REPO=WorldDigitalai/worlddigital-ai
SA=github-deploy@$P.iam.gserviceaccount.com
RUNTIME_SA=$N-compute@developer.gserviceaccount.com

gcloud config set project "$P" >/dev/null
echo "1/5 Enabling services…"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com iamcredentials.googleapis.com sts.googleapis.com >/dev/null

echo "2/5 Deploy account permissions…"
gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create github-deploy --display-name="github-deploy"
for r in run.admin cloudbuild.builds.editor artifactregistry.admin iam.serviceAccountUser storage.admin serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$SA" --role="roles/$r" --condition=None -q >/dev/null
done
# Runtime + build account (Cloud Run "deploy from source" builds with it).
for r in secretmanager.secretAccessor cloudbuild.builds.builder artifactregistry.writer logging.logWriter storage.objectViewer; do
  gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$RUNTIME_SA" --role="roles/$r" --condition=None -q >/dev/null
done

echo "3/5 Letting GitHub ($REPO) sign in without a key…"
gcloud iam workload-identity-pools describe github --location=global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers describe github --location=global --workload-identity-pool=github >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc github --location=global --workload-identity-pool=github \
    --display-name="GitHub" --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='$REPO'"
gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$N/locations/global/workloadIdentityPools/github/attribute.repository/$REPO" >/dev/null

echo "4/5 Secrets (typing is hidden; paste the value and press Enter)…"
for s in MONGODB_URI OPENAI_API_KEY DATAFORSEO_LOGIN DATAFORSEO_PASSWORD STRIPE_SECRET_KEY RESEND_API_KEY INTERNAL_TOKEN; do
  if gcloud secrets describe "$s" >/dev/null 2>&1; then
    echo "   $s already exists, kept"
  else
    read -rsp "   $s: " v; echo
    [ -n "$v" ] || { echo "   empty, skipped — run the script again later"; continue; }
    printf '%s' "$v" | gcloud secrets create "$s" --data-file=- --replication-policy=automatic >/dev/null
    echo "   $s saved"
  fi
done

echo "5/5 Done. Tell Claude 'gcp done' and it will deploy."
