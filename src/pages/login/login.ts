import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, LoadingController  } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HomePage } from '../home/home';
import { AuthServiceProvider } from '../../services/auth.service';

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
		public loadingCtrl: LoadingController
	) {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
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
			.then(
				() => this.navCtrl.setRoot(HomePage),
				error => this.loginError = error.message
			);
	}

	googleLogin(){
    this.auth.googleLogin()
    .then(
      () => this.navCtrl.setRoot(HomePage),
      error => this.loginError = error.message
    );
	}

	
	
	

}