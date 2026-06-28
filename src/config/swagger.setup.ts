import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_UI_VERSION = '5.32.6';
const SWAGGER_PATH = 'api/docs';
const SWAGGER_JSON_PATH = 'api/docs-json';

function buildSwaggerHtml(specUrl: string): string {
  const cdnBase = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ApexSupport API</title>
  <link rel="stylesheet" href="${cdnBase}/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${cdnBase}/swagger-ui-bundle.js"></script>
  <script src="${cdnBase}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: 'StandaloneLayout',
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>`;
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('ApexSupport API')
    .setDescription('AI-Powered SaaS Support Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerUiEnabled: false,
    jsonDocumentUrl: SWAGGER_JSON_PATH,
    raw: ['json'],
  });

  const httpAdapter = app.getHttpAdapter();
  const serveDocs = (_req: unknown, res: { type: (t: string) => void; send: (body: string) => void }) => {
    res.type('text/html');
    res.send(buildSwaggerHtml(`/${SWAGGER_JSON_PATH}`));
  };

  httpAdapter.get(`/${SWAGGER_PATH}`, serveDocs);
  httpAdapter.get(`/${SWAGGER_PATH}/`, serveDocs);
}
