import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HomePage } from '../home/home';
import { AuthServiceProvider } from '../../services/auth.service';
import { ToastController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
	loginForm: FormGroup;
	loginError: string;

	constructor(
		private navCtrl: NavController,
		private auth: AuthServiceProvider,
		public formBuilder: FormBuilder,
		private toastCtrl: ToastController) {
    
    this.loginForm = this.formBuilder.group({
      //email: ['', Validators.required],
      email: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.required],
    });
  }
  
  login() {
		let data = this.loginForm.value;

		if (!data.email) {
			return;
		}

		let credentials = {
			email: data.email,
			password: data.password
		};
    this.auth.signInWithEmail(credentials)
    .then(() => {
      this.navCtrl.setRoot(HomePage);
      this.successToast();
    })
    .catch(error => {
      this.loginError = error.message;
      this.errorToast();
    });
    /*
			.then(
				() => this.navCtrl.setRoot(HomePage),
        error => this.loginError = error.message
        this.errorToast()
      );
      */
  }

  successToast() {
    let toast = this.toastCtrl.create({
      message: this.loginForm.value.email+' Sign In Successfully',
      duration: 3000,
      position: 'bottom',
      cssClass: "toast-success"
    });
  
    toast.present();
  }
  
  errorToast() {
    let toast = this.toastCtrl.create({
      message: 'Error! Wrong Email or Password',
      duration: 3000,
      position: 'bottom',
      cssClass: "toast-error"
    });
  
    toast.present();
  }

	googleLogin(){
    this.auth.googleLogin()
    .then(
      () => this.navCtrl.setRoot(HomePage),
      error => this.loginError = error.message
    );
	}

	
	
	

}