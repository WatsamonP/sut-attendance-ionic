import { NavController, LoadingController } from 'ionic-angular';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import AuthProvider = firebase.auth.AuthProvider;
import { HomePage } from '../pages/home/home';
import { AngularFireDatabase } from 'angularfire2/database';

@Injectable()
export class AuthServiceProvider {

  private user: firebase.User;
  userList: any;

	constructor(
    public afAuth: AngularFireAuth,private db: AngularFireDatabase) {
		this.afAuth.authState.subscribe(user => {
			this.user = user;
		});
	}

	signInWithEmail(credentials) {
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

  currentUser() {
    return this.user && this.user;
  }


  private socialSignIn(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((credential) => {
        console.log(credential.user);
        this.user = credential.user;
        this.updateUser(this.user);
      })
      .catch(error => console.log(error));
  }

  googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.socialSignIn(provider);
  }

  signOut(): Promise<void> {
    return this.afAuth.auth.signOut();
  }

  updateUser(user){
    this.db.object(`users/${this.user.uid}/profile`)
      .update({
        email: this.user.email,
        username : this.user.displayName.split(" ")[0],
        firstName : this.user.displayName.split(" ")[0],
        lastName : this.user.displayName.split(" ")[1],
        tel : ''
    });
  }

}