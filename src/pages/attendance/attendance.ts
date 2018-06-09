import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, MenuController, ModalController } from 'ionic-angular';
//import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthServiceProvider } from '../../services/auth.service';
import { AlertController } from 'ionic-angular';
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { Student } from '../../services/student.model';
import { Course } from '../../services/course.model';
import moment from 'moment';
import { HomePage } from '../home/home';
import { Toast } from '@ionic-native/toast';
import { ToastController } from 'ionic-angular';
import { ScanModalPage } from './scan-modal/scan-modal';
import { ManageAttendancePage } from '../attendance/manage-attendance/manage-attendance';
import { AttendanceService } from '../../services/attendance.service'

@IonicPage()
@Component({
  selector: 'page-attendance',
  templateUrl: 'attendance.html',
})
export class AttendancePage {
  //navParams
  course_id : string;
  course_name : string;
  activity : {id: '', name: ''};
  //Model & List
  studentList: Student[];
  courseList : Course[];
  scheduleAttendanceList : any;
  studentDataList : any;
  // Val
  studentCount : any;
  attendance_status : string;
  attendance_score : number;
  lateScore : any;
  lateTime : any;
  onTimeScore : any;
  leaveScore : any;
  pic : any;
  // TIME
  today = moment().format("DD-MM-YYYY HH:mm"); 
  todayTime = moment().format("HH:mm"); 
  lateHour : string;
  lateMinute : string;
  isToggled: boolean = false;
  studentFlag: boolean = false;
  //
  public scannedText: string;
  public buttonText: string;
  public loading: boolean;
  attendanceData : any;
  leaveActivity : String;
 
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    public alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private platform: Platform,
    private menu: MenuController,
    private toast: Toast,
    private toastCtrl: ToastController,
    public modalCtrl: ModalController,
    private attendance: AttendanceService) {

      
    
      this.course_id = navParams.get('course_id');
      this.course_name = navParams.get('course_name');
      this.activity = navParams.get('activity');
      this.pic = navParams.get('pic');

    const coursePath = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance`;
    const studentPath = `users/${this.auth.currentUserId()}/course/${this.course_id}/students`;
    this.isToggled = false;
    this.attendance_status = '';
    this.leaveActivity = 'none';
    this.attendanceData = {};

    //Query scheduleAttendanceList
    this.db.list(coursePath).snapshotChanges().map(actions => {
      return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      }).subscribe(items => {
        this.scheduleAttendanceList = items;
        return items.map(item => item.key);
      });

    //Query Student
    this.db.list(studentPath).snapshotChanges().map(actions => {
      return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      }).subscribe(items => {
        this.studentList = items;
        this.studentCount = this.studentList.length;
          return items.map(item => item.key);
      });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CoursePage');
  }

  ionViewDidEnter() {
    this.menu.swipeEnable(false);
  }

  ionViewWillLeave() {
    this.menu.swipeEnable(true);
   }
   
  pushToScanPage(data){
    let scan = this.modalCtrl.create(ScanModalPage, 
      { 
        activity : this.activity,
        course_id : this.course_id,
        attendanceData : data,
        leaveActivity : this.leaveActivity
    });

    scan.onDidDismiss(data => {
      console.log(data);
    });
    scan.present();

  }

  /////////////////////////////////////////////

  public onClick_Create(){
    let page = this.modalCtrl.create(ManageAttendancePage, 
      { 
        course_id : this.course_id,
        scheduleAttendanceList : this.scheduleAttendanceList,
        studentList : this.studentList
    });
    page.onDidDismiss(data => {
      if(data != 'close'){
        console.log(data);
        for(var i=0; i<this.scheduleAttendanceList.length ;i++){
          if(this.scheduleAttendanceList[i].id == data){
            this.attendanceData = this.scheduleAttendanceList[i];
            this.leaveActivity = 'none';
            this.pushToScanPage(this.attendanceData);
          }
        }
        
      }
    });
    page.present();
  }

  public onClick_UpdateAttendanceLeave(id,item){
    this.attendanceData = item;
    this.attendance_status = 'Leave';
    let prompt = this.alertCtrl.create({
      title: 'เลือกรายการ',
      buttons: [
        {
          text: 'สแกน',
          handler: data => {
            this.leaveActivity = 'scan';
            this.pushToScanPage(this.attendanceData);
          }
        },
        {
          text: 'ป้อนรหัสนักศึกษา',
          handler: data => {
            this.leaveActivity = 'string';
            this.pushToScanPage(this.attendanceData);
          }
        },{
          text: 'Cancel',
          handler: data => {}
        },
      ]
    });
    prompt.present();
  }

  public onClick_UpdateAttendance(id,item){
    this.attendanceData = item;
    this.leaveActivity = 'none';
    this.pushToScanPage(this.attendanceData);
  }

  public onClick_Delete(id){
    let confirm = this.alertCtrl.create({
      title: 'DELETE',
      message: 'ต้องการลบรายการ ? <br>เมื่อลบแล้วจะไม่สามารถกู้คืนได้',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'OK',
          handler: () => {
            this.deleteAttendnace(id);
            console.log('OK clicked');
          }
        }
      ]
    });
    confirm.present();
  }
  deleteAttendnace(id : String){
    let path = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance/${id}`;
    this.db.object(path).remove();
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/attendance/${id}`)
        .remove();
    }
  }

  public onClick_Setting(lateIndex, lateItem){
    let page = this.modalCtrl.create(ManageAttendancePage, 
      { 
        course_id : this.course_id,
        scheduleAttendanceList : this.scheduleAttendanceList,
        studentList : this.studentList,
        lateIndex : lateIndex,
        lateItem : lateItem,
    });

    page.onDidDismiss(data => {
      console.log('close')
    });
    page.present();
  }





}
