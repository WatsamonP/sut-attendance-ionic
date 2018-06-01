import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, LoadingController  } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HomePage } from '../home/home';
import { AuthServiceProvider } from '../../services/auth.service';
import { NativeStorage } from '@ionic-native/native-storage';
import { GooglePlus } from '@ionic-native/google-plus';
import * as firebase from 'firebase/app';

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
		public loadingCtrl: LoadingController,
		public nativeStorage: NativeStorage,
		public googlePlus: GooglePlus
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
		this.googlePlus.login({
			'webClientId' : '386280596287-7rqut0vvpivqvesqq2j4df7u92ls9kkk.apps.googleusercontent.com',
			'offline' : true
		}).then(res=>{
			firebase.auth().signInWithCredential(firebase.auth.GoogleAuthProvider.credential(res.idToken))
			.then(success=>{
				alert('Success');
			}).catch(error=>{
				alert('Error')
			})
		})
	}

	
	
	

}