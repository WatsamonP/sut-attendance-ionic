import { NavController, LoadingController } from 'ionic-angular';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import AuthProvider = firebase.auth.AuthProvider;
import { GooglePlus } from '@ionic-native/google-plus';
import { HomePage } from '../pages/home/home';
import { NativeStorage } from '@ionic-native/native-storage';

@Injectable()
export class AuthServiceProvider {

	private user: firebase.User;

	constructor(
    public afAuth: AngularFireAuth) {
		this.afAuth.authState.subscribe(user => {
			this.user = user;
		});
	}

	signInWithEmail(credentials) {
		console.log('Sign in with email');
		return this.afAuth.auth.signInWithEmailAndPassword(credentials.email,
			credentials.password);
  }
  
  get authenticated(): boolean {
    return this.user !== null;
  }

  currentUserEmail() {
    return this.user && this.user.email;
  }
  currentUserId() {
    return this.user && this.user.uid;
  }

  /*

  googleLogin() {
		if (this.platform.is('cordova')) {
			this.nativeGoogleLogin();
		} else {
			this.webGoogleLogin();
		}
	}
	
	async nativeGoogleLogin(): Promise<void> {
		try {
	
			const gplusUser = await this.gplus.login({
				'webClientId': 'your-webClientId-XYZ.apps.googleusercontent.com',
				'offline': true,
				'scopes': 'profile email'
			})
	
			return await this.afAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(gplusUser.idToken))
	
		} catch(err) {
			console.log(err)
		}
	}

	async webGoogleLogin(): Promise<void> {
		try {
			const provider = new firebase.auth.GoogleAuthProvider();
			const credential = await this.afAuth.auth.signInWithPopup(provider);
	
		} catch(err) {
			console.log(err)
		}
	
  }
  */

  /*
  
  doGoogleLogin(){
    let nav = this.navCtrl;
    let loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    loading.present();
    this.googlePlus.login({
      'scopes': '', // optional, space-separated list of scopes, If not included or empty, defaults to `profile` and `email`.
      'webClientId': '1091419544653-nhncrb7n0sk43t3unhqk3q8h6smnbt22.apps.googleusercontent.com', // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
      'offline': true
    })
    .then((user) => {
      loading.dismiss();

      this.nativeStorage.setItem('user', {
        name: user.displayName,
        email: user.email,
        picture: user.imageUrl
      })
      .then(() => {
        nav.push(HomePage);
      }, (error) => {
        console.log(error);
      })
      
    }, (error) => {
      loading.dismiss();
    });

  }
  */

  signOut(): Promise<void> {
    return this.afAuth.auth.signOut();
  }

}