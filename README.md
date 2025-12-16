# File Manager

Random file manager for my personal use :D

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://www.shadcn-svelte.com/) (bits-ui)
- **Database**: MySQL
- **ORM/Query Builder**: [Kysely](https://kysely.dev/)
- **Validation**: [Zod](https://zod.dev/)
- **Package Manager**: pnpm

## Prerequisites

- Node.js (v20+ recommended)
- pnpm
- MySQL Database

## Installation

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd UploaderNew
    ```

2.  **Install dependencies**

    ```bash
    pnpm install
    ```

3.  **Configure Environment**

    Create a `.env` file in the root directory with the following variables:

    ```env
    DATABASE_IP=localhost
    DATABASE_PORT=3306
    DATABASE_USER=root
    DATABASE_PASSWORD=your_password
    DATABASE_NAME=uploader_db
    JWT_SECRET=your_super_secret_jwt_key
    ```

4.  **Database Setup**

    Run the migrations to set up the database schema:

    ```bash
    pnpm migrate
    ```

    To generate the database types (if you modify the schema):

    ```bash
    pnpm genDatabaseSchema
    ```

## Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

## Building for Production

Build the application:

```bash
pnpm build
```

To preview the production build:

```bash
pnpm preview
```

To start the production server:

```bash
pnpm start
```

## Migration Tool

If you are migrating from the legacy PHP version, a script is provided to import files from the old `.storage` folder.

**Usage:**

```bash
npx tsx migrate_from_php.ts <source_directory> [user_id]
```

- `<source_directory>`: Absolute path to the old storage folder.
- `[user_id]`: (Optional) ID of the user to assign the files to.

**Example:**

```bash
npx tsx migrate_from_php.ts /var/www/html/old_project/.storage 1
```

## Project Structure

```
src/
├── lib/
│   ├── components/   # UI components (Shadcn, etc.)
│   ├── server/       # Server-side logic (DB, Auth, API routes)
│   └── ...
├── routes/           # SvelteKit routes
│   ├── api/          # API endpoints
│   ├── files/        # File list view
│   ├── images/       # Image gallery view
│   ├── videos/       # Video list view
│   └── ...
├── types/            # TypeScript definitions
└── ...
```

## License

[MIT](LICENSE)
