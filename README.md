# NovaGuard Backend (Express) - Azure App Service

## Local run (Windows / macOS / Linux)
```bash
npm install
npm start
```

Open:
- http://localhost:3000
- http://localhost:3000/api/health

## Azure App Service settings
In your App Service -> Configuration -> Application settings:
- CORS_ORIGIN = https://<your-front>.azurestaticapps.net
- NODE_ENV = production (optional)

## Deploy with GitHub Actions
Azure Deployment Center can generate a workflow.
Or use `.github/workflows/azure-webapp.yml` and set the secret:
- AZURE_WEBAPP_PUBLISH_PROFILE
