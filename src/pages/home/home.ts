import { Component } from '@angular/core';
import { NavController, AlertController, reorderArray } from 'ionic-angular';

import { AngularFireDatabase } from 'angularfire2/database';
import { AuthServiceProvider } from '../../services/auth.service';
import { Course } from '../../services/course.model';
import { AttendancePage } from '../../pages/attendance/attendance';
import { QuizPage } from '../../pages/quiz/quiz';
import { LoginPage } from '../login/login';
import { AttendanceService } from '../../services/attendance.service'

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
  groupList : any;

  constructor(
    public navCtrl: NavController,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    public alertCtrl: AlertController,
    private attendance: AttendanceService) {

      //this.doRefresh(0);

      const path = `users/${this.auth.currentUserId()}/course/`;
      this.db.list(path).snapshotChanges().map(actions => {
        return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      }).subscribe(items => {
        this.courseList = items;
        return items.map(item => item.key);
      });
  }

  selectedCourse(cid : string, cname : string,index){
    this.navCtrl.push(AttendancePage, {
      course_id: cid,
      course_name: cname,
      activity : {id: 'attendance', name: 'ATTENDANCE'},
      pic : index
    });
  }
  /*
  selectGroup(cid,cname,img,activity){
    this.groupList = [];
    let group;
    for(var i=0; i<this.courseList.length; i++){
      if(this.courseList[i].id == cid ){
        this.groupList = Object.keys(this.courseList[i].group)
          .map(key => Object.assign({ key }, this.courseList[i].group[key]));
      }
    }

    let alert = this.alertCtrl.create();
    alert.setTitle('เลือกรายการที่ต้องการ');
    if(activity == 'option'){
      if(this.groupList.length == 1){
        this.showRadio(cid,cname,this.groupList[0],img);
        return false;
      }else{
        for(var i=0 ; i<this.groupList.length ; i++){
          alert.addInput({ type: 'radio', label: this.groupList[i].name, value: this.groupList[i], checked: false });
        }
        alert.addInput({ type: 'radio', label: 'Change Color', value: 'color',checked: false });
      }
    }else if(activity == 'attendance'){
      if(this.groupList.length == 1){
        this.gotoAttendance(cid,cname,this.groupList[0]);
        return false;
      }else{
        for(var i=0 ; i<this.groupList.length ; i++){
          alert.addInput({ type: 'radio', label: this.groupList[i].name, value: this.groupList[i], checked: false });
        }
      }
    }
    
    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        if(data == 'color'){
          this.colorAlert(cid, img);
        }
        if(activity == 'option'){
          if(this.groupList.length != 1){
            this.showRadio(cid,cname,data,img);
          }
        }else if(activity == 'attendance'){
          if(this.groupList.length != 1){
            this.gotoAttendance(cid,cname,data);
          }
        }
        
      }
    });
    alert.present();
  }
  */

  showRadio(cid : string, cname : string,group : any, img: String, index) {
    console.log(group);
    let alert = this.alertCtrl.create();
    alert.setTitle('เลือกรายการที่ต้องการ');
    alert.addInput({
      type: 'radio', label: 'Attendance', value: 'attendance', checked: true });
    alert.addInput({
      type: 'radio', label: 'Quiz', value: 'quiz', checked: false });
    alert.addInput({
      type: 'radio', label: 'Homework', value: 'hw', checked: false });
    alert.addInput({
      type: 'radio', label: 'Lab', value: 'lab', checked: false });
    alert.addInput({ type: 'radio', label: 'Change Color', value: 'color',checked: false });
    
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
            course_name: cname,
            activity : {id: 'attendance', name: 'ATTENDANCE'},
            pic : index
          });
        }else if(data == 'quiz'){
          this.navCtrl.push(QuizPage, {
            course_id: cid,
            course_name: cname,
            activity : {id: 'quiz', name: 'QUIZ'},
            pic : index
          });
        }else if(data == 'hw'){
          this.navCtrl.push(QuizPage, {
            course_id: cid,
            course_name: cname,
            activity : {id: 'hw', name: 'HOMEWORK'},
            pic : index
          });
        }else if(data == 'lab'){
          this.navCtrl.push(QuizPage, {
            course_id: cid,
            course_name: cname,
            activity : {id: 'lab', name: 'LAB'},
            pic : index
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
