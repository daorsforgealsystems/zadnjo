# Supabase Extension for Netlify

Danger zone

## Extension details

Welcome to the Supabase Extension for Netlify! This extension streamlines your workflow by connecting your Supabase and Netlify projects. Here's what it offers:

### Seamless Authentication
Easily connect your Supabase account using OAuth.

### Project Selection
Choose your desired Supabase project from your account.

### Automated Environment Configuration
We'll set up these crucial environment variables for you:

- `SUPABASE_DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`

### Framework Compatibility
Select your frontend framework (e.g., Next.js, Nuxt, Vue), and we'll configure the appropriate environment variables.

### Custom Prefix Option
Using a different framework? No problem. You can specify a custom prefix for your environment variables.

## Getting started

Read more about this extension on the [Netlify docs](https://docs.netlify.com/integrations/supabase/overview/)

### Installation

On this page, install the extension by selecting 'install' at the top of this page.

### Connecting to your site

Visit the Site Configuration for the site you want to connect to Supabase. Then, in the sidebar, select 'Supabase'. On the card for the Supabase extension, select 'Connect' to connect your Supabase account. When you're connected you can select your Supabase project and framework (if you selected 'Other' during configuration, you will be able to specify a custom prefix for your environment variables). Finally, click 'Save'.

### Using the Supabase client in your site

You can use the Supabase client in your site to interact with your Supabase project.

```javascript
const supabase = createClient(
  process.env.SUPABASE_DATABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

or when you set up a framework, you'll want to use a public environment variables, for example:

```javascript
const supabase = createClient(
  process.env.SUPABASE_DATABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);