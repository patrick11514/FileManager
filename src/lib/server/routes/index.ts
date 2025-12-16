import { router } from '../api';
import { authRouter } from './auth';
import { filesRouter } from './files';
import { usersRouter } from './users';

//DOCS: https://raw.githubusercontent.com/patrick11514/SveltekitAPI/refs/heads/main/README.md
export const r = router({
    auth: authRouter,
    files: filesRouter,
    users: usersRouter
});

export type AppRouter = typeof r;
