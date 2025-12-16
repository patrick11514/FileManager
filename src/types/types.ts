import type { ErrorApiResponse } from '@patrick115/sveltekitapi';

export type UserState =
    | {
          logged: false;
      }
    | {
          logged: true;
          data: UserData;
      };

export type UserData = {
    id: number;
    username: string;
};

export type SuccessApiResponse<T> = {
    status: true;
    data: T;
};

export type ApiResult<T> = SuccessApiResponse<T> | (ErrorApiResponse & { status: false });
