import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface APISignUp{
  message : string,
  user : object,
  token : string,
}


@Component({
  selector: 'app-signup',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {

  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  apiurl = environment.apiUrl;
  messages :string[] =[];
  payload ={};
  //General user attributes
  role="";
  first_name ="";
  last_name = "";
  username = "";
  email = "";
  password = "";

  //Doctor attributes
  specialty ="";
  session_duration = -1;
  buffer_time = -1;

  //Patient attributes
  date_of_birth="";
  phone_number="";
  medical_history="";

  //Patient attributes
  doctor_id =-1;

  //admin attributes
  

  validateData():boolean{
    this.messages=[];
    if(!this.first_name || this.first_name.length>150 || this.first_name.length<3){
      this.messages.push("first name minimum length =3 , maximum length =150");
      return false;
    }

    if(!this.last_name || this.last_name.length>150 || this.last_name.length<3){
      this.messages.push("last name minimum length =3 , maximum length =150");
      return false;
    }

    if(!this.username || this.username.length>150 || this.username.length<3){
      this.messages.push("username minimum length =3 , maximum length =150");
      return false;
    }

    if(!this.email || this.email.length>255 /* || regex*/){
      this.messages.push("enter valid email");
      return false;
    }

    if(!this.password || this.password.length>150 || this.password.length<8){
      this.messages.push("password minimum length =8 , maximum length =150");
      return false;
    }

    if(this.role=="DOCTOR"){
      let specialities =['CARDIOLOGY','DERMATOLOGY','NEUROLOGY','PEDIATRICS','ORTHOPEDICS','GENERAL'] ;
      let session_durations = [15,30];
      if(!this.specialty || !specialities.includes(this.specialty)){
        this.messages.push("choose valid speciality");
        return false;
      }
      if(!this.session_duration || !session_durations.includes(this.session_duration)){
        this.messages.push("choose valid session duration");
        return false;
      }
      if(!this.buffer_time || this.buffer_time<1){
        this.messages.push("enter valid buffer time");
        return false;
      }           

      this.payload =
      { first_name:this.first_name,
        last_name:this.last_name,
        username:this.username,
        email:this.email,
        password:this.password,
        role:this.role,
        specialty:this.specialty,
        session_duration:this.session_duration,
        buffer_time:this.buffer_time
      }
    

    }else if(this.role=="PATIENT"){
      if(!this.date_of_birth /*||date_of_birth = serializers.DateField(required=True, input_formats=['%Y-%m-%d'], write_only=True)*/){
        this.messages.push("enter valid birthdate YY-MM-DD");
        return false;
      }
      if(!this.phone_number || this.phone_number.length<7){
        this.messages.push("enter valid phone ");
        return false;
      }
      this.payload =
      { first_name:this.first_name,
        last_name:this.last_name,
        username:this.username,
        email:this.email,
        password:this.password,
        role:this.role,
        date_of_birth:this.date_of_birth,
        phone_number:this.phone_number,
        medical_history:this.medical_history
      }

    }else if(this.role == "RECEPTIONIST"){
      if(this.doctor_id<0){
        this.messages.push("enter valid doctor id");
        return false;
      }
      this.payload =
      { first_name:this.first_name,
        last_name:this.last_name,
        username:this.username,
        email:this.email,
        password:this.password,
        role:this.role,
        doctor_id:this.doctor_id,
      }
    }else if(this.role == "ADMIN"){
      this.payload =
      { first_name:this.first_name,
        last_name:this.last_name,
        username:this.username,
        role:this.role,
        email:this.email,
        password:this.password
      }
    }else{
      this.messages.push("invalid role");
      return false;
    }
    return true;
  }

  signUp(){
    let isValidated = this.validateData()
    this.cdr.detectChanges();
    if(isValidated){
       this.httpClient.post<APISignUp>(`${this.apiurl}/api/accounts/signup/`,this.payload).subscribe({
      next: (response) => {
        console.log("signedUp in successfully");
        this.messages.push("signedUp in successfully")
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.messages.push(error);
        this.cdr.detectChanges();
      }
    });
    }
  }

}
