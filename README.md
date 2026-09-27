# LapGPT

## Deployment on Vercel

1. Push the project to GitHub.
2. Create a new Vercel project and connect the repository.
3. In Vercel > Project Settings > Environment Variables, add:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-email@gmail.com`
   - `SMTP_PASSWORD=your-gmail-app-password`
   - `EMAIL_TO=your-recipient@example.com`
   - `EMAIL_FROM=LapGPT <your-email@gmail.com>`
   - `APP_URL=https://your-vercel-domain.vercel.app`
4. Deploy.

## Email setup

For Gmail, use an App Password rather than the normal password.

## Local development

- `npm install`
- `npm run server` serves the built site and API together at `http://localhost:4000`.
- `npm run dev` starts the Vite development site at `http://localhost:5173`; run `npm run server` in a second terminal for API requests.

## Run the production site locally

- `npm start` builds the site and serves the frontend and API together at `http://localhost:4000`.
