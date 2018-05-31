import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AngularFireDatabase } from 'angularfire2/database';
import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { AboutMePage } from '../pages/about-me/about-me';
//
import { AuthServiceProvider } from '../services/auth.service';
import { User } from '../services/user.model';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any;
  pages;
  userData = {};
  test;

  constructor(
    public platform: Platform, 
    public statusBar: StatusBar, 
    public splashScreen: SplashScreen,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase) {
    this.initializeApp();

    this.pages = [
      { title: 'Home', component: HomePage, icon: 'home'},
      { title: 'About Me', component: AboutMePage, icon: 'contacts'},
      { title: 'Sign Out', component: "", icon: 'log-out'}
    ];
    
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      
    });

    this.auth.afAuth.authState
    .subscribe(
      user => {
        if (user) {
          this.rootPage = HomePage;
          this.getUserProfile();
        } else {
          this.rootPage = LoginPage;
        }
      },
      () => {
        this.rootPage = LoginPage;
      }
    );
  }

  // set our app's pages

  getUserProfile(){

    const path = `users/${this.auth.currentUserId()}/profile`;

    this.db.object(path).snapshotChanges().map(action => {
      const $key = action.payload.key;
      const data = { $key, ...action.payload.val() };
      this.userData = data;
      this.userData = {
        email : data.email,
        username : data.username,
        firstName : data.firstName,
        lastName : data.lastName,
        tel : data.tel,
        avatar : data.firstName.charAt(0)
      }
      return data;
    }).subscribe();
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    if(page.component == ""){
      this.logout()
    }else{
      this.nav.setRoot(page.component);
    }
  }

  logout() {
    this.auth.signOut();
    this.nav.setRoot(LoginPage);
  }

}
