export type UserState =
    | {
          logged: false;
      }
    | {
          logged: true;
          data: UserData;
      };

export type UserData = {
    //TODO
};
