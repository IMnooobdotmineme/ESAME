# my-org-auth

This is a [Next.js](https://nextjs.org) project bootstrapped with `create-next-app`
(TypeScript, Tailwind CSS v4, ESLint, App Router, `src/` directory).

## Getting Started

1. Unzip this project and open the folder in VS Code.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
   The organization sign-up form lives at [http://localhost:3000/sign-up](http://localhost:3000/sign-up).

## Project structure

```
src/
  app/
    layout.tsx       # Root layout
    page.tsx         # Home page (links to /sign-up)
    globals.css      # Tailwind styles
    sign-up/
      page.tsx       # Organization Sign Up form (your component)
```

## Notes

- The submit handler currently just logs form data to the console
  (`console.log('Organization Sign Up Data:', formData)`) — wire up your
  own authentication logic in `src/app/sign-up/page.tsx`.
- The theme color `#4F46E5` is used on the button and focus rings — change it there if needed.
