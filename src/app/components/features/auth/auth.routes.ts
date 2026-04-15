import { Routes } from "@angular/router";
import { Login } from "./login/login";
import { Signup } from "./signup/signup";
import { ResetPassword } from "./reset-password/reset-password";
import { Profile } from "./profile/profile"
import { ChangePassword } from "./change-password/change-password"

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
    path: 'reset-password',
     component: ResetPassword 
  },
  {
      path : 'ChangePassword',
      component : ChangePassword
    },
    {
      path : 'profile',
      component : Profile
    },
 
]