import { Component } from '@angular/core';
import { NavController, AlertController, reorderArray } from 'ionic-angular';

import { AngularFireDatabase } from 'angularfire2/database';
import { AuthServiceProvider } from '../../services/auth.service';
import { Course } from '../../services/course.model';
import { AttendancePage } from '../../pages/attendance/attendance';
import { QuizPage } from '../../pages/quiz/quiz';
import { LoginPage } from '../login/login';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  courseList: Course[];
  isToggled: boolean = false;
  btnName: any = 'EDIT';
  flag: any = false;
  activity : {id: '',name: ''};
  testItem: [{},{}];
  courseTest : any;

  constructor(
    public navCtrl: NavController,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    public alertCtrl: AlertController) {

      //this.doRefresh(0);

      const path = `users/${this.auth.currentUserId()}/course/`;
      this.db.list(path).snapshotChanges().map(actions => {
        return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      }).subscribe(items => {
        this.courseList = items;
        return items.map(item => item.key);
      });
  }

  selectedCourse(cid : string, cname : string){
    this.navCtrl.push(AttendancePage, {
      course_id: cid,
      course_name: cname
    });
  }

  showRadio(cid : string, cname : string, img: String) {
    let alert = this.alertCtrl.create();
    alert.setTitle('เลือกรายการที่ต้องการ');

    alert.addInput({
      type: 'radio',
      label: 'Attendance',
      value: 'attendance',
      checked: true
    });
    alert.addInput({
      type: 'radio',
      label: 'Quiz',
      value: 'quiz',
      checked: false
    });
    alert.addInput({
      type: 'radio',
      label: 'Homework',
      value: 'hw',
      checked: false
    });
    alert.addInput({
      type: 'radio',
      label: 'Change Color',
      value: 'color',
      checked: false
    });

    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        if(data == 'color'){
          this.colorAlert(cid, img);
        }
        if(data == 'attendance'){
          this.navCtrl.push(AttendancePage, {
            course_id: cid,
            course_name: cname
          });
        }else if(data == 'quiz'){
          this.navCtrl.push(QuizPage, {
            course_id: cid,
            course_name: cname,
            activity : {id: 'quiz', name: 'QUIZ'}
          });
        }else if(data == 'hw'){
          this.navCtrl.push(QuizPage, {
            course_id: cid,
            course_name: cname,
            activity : {id: 'hw', name: 'HOMEWORK'}
          });
        }
      }
    });
    alert.present();
  }

  logout() {
    this.auth.signOut();
    this.navCtrl.setRoot(LoginPage);
  }

  colorAlert(cid,img) {
    //console.log(cimg);
    let alert = this.alertCtrl.create();
    alert.setTitle('Color');
    alert.addInput({ type: 'radio', label: 'Default Image', value: 'pic', checked: true });
    alert.addInput({ type: 'radio', label: 'Pink', value: '#fa678c', checked: false });
    alert.addInput({ type: 'radio', label: 'Sky-Blue', value: '#669cfa', checked: false });
    alert.addInput({ type: 'radio', label: 'Orange', value: '#fd7c31', checked: false });
    alert.addInput({ type: 'radio', label: 'Red', value: '#f53d3d', checked: false });
    alert.addInput({ type: 'radio', label: 'Blue', value: '#3947c9', checked: false });
    alert.addInput({ type: 'radio', label: 'Green', value: '#32ad32', checked: false });
    alert.addInput({ type: 'radio', label: 'White', value: 'white', checked: false });
    alert.addInput({ type: 'radio', label: 'Black', value: 'black', checked: false });
    
    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        this.db.object(`users/${this.auth.currentUserId()}/course/${cid}/`)
          .update({ img : data,});
      }
    });
    alert.present();
  }

}
