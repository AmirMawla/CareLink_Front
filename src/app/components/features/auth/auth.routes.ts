import { Routes } from "@angular/router";
import { Login } from "./login/login";
import { Signup } from "./signup/signup";
import { ChangePassword } from "./change-password/change-password";
import { Profile } from "./profile/profile";
import { ResetPassword } from "./reset-password/reset-password";

export const AUTH_ROUTES: Routes =[
{
    path : 'login',
    component: Login
  },
  {
    path : 'register',
    component : Signup
  },
  {
    path : 'ChangePassword',
    component : ChangePassword
  },
  {
    path : 'profile',
    component : Profile
  },
  { 
    path: 'reset-password',
     component: ResetPassword 
  },

]