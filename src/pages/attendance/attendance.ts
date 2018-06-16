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
  scanRepeatActivity: String;
  isCheckGroupCount: boolean = false;
  groupCount : any;
  items: any = [];
  itemExpandHeight: number = 135;
  groupList : any;

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
      this.groupCount = navParams.get('groupCount');
      console.log(this.groupCount);

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
        this.items = this.scheduleAttendanceList;
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

   expandItem(item){
    this.groupList = [];
    let temp;
    let countLeave = 0;
    let countLate = 0;
    let countOnTime = 0;
    let countMissed = 0;
    let all = 0;
    console.log(this.groupCount)
    for(var i=1; i<=this.groupCount ;i++){
      countLeave = 0;countLate = 0;countOnTime = 0;countMissed = 0;all = 0;
      for(var j=0; j<this.studentList.length ;j++){
        if(this.studentList[j].group == i){
          //console.log(this.studentList[i].attendance[id].status);
          temp = this.studentList[j].attendance[item.id].status
          all++;
          if(temp == 'Leave'){
            countLeave++;
          }else if(temp == 'Late'){
            countLate++;
          }else if(temp == 'onTime'){
            countOnTime++;
          }else if(temp == 'Missed Class'){
            countMissed++;
          }
        }
      }
      this.groupList.push({gid:i,
        countLeave:countLeave,
        countLate:countLate,
        countOnTime:countOnTime,
        countMissed:countMissed,
        all:all});
    }
    console.log(this.groupList);

    this.items.map((listItem) => {
        if(item == listItem){
            listItem.expanded = !listItem.expanded;
        } else {
            listItem.expanded = false;
        }
        return listItem;
    });
  }

   //////////////////////////////////////////////
   
  pushToScanPage(data){
    let scan = this.modalCtrl.create(ScanModalPage, 
      { 
        activity : this.activity,
        course_id : this.course_id,
        attendanceData : data,
        leaveActivity : this.leaveActivity,
        scanRepeatActivity : this.scanRepeatActivity
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
    let alert = this.alertCtrl.create();
    alert.setTitle('เลือกรายการ');
    alert.addInput({ type: 'radio',label: 'สแกน',value: '0',checked: false});
    alert.addInput({ type: 'radio',label: 'ป้อนรหัสนักศึกษา',value: '1',checked: true});
    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        if(data == '0'){
          this.leaveActivity = 'scan';
          this.pushToScanPage(this.attendanceData);
        }else if(data == '1'){
          this.leaveActivity = 'string';
          this.pushToScanPage(this.attendanceData);
        }else{
          console.log('error');
        }
      }
    });
    alert.present();
  }

  public onClick_UpdateAttendance(id,item){
    this.attendanceData = item;
    this.leaveActivity = 'none';

    let alert = this.alertCtrl.create();
    alert.setTitle('เลือกรายการ');
    alert.addInput({ type: 'radio',label: 'สแกน',value: '0',checked: false});
    alert.addInput({ type: 'radio',label: 'ป้อนรหัสนักศึกษา',value: '1',checked: true});
    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        if(data == '0'){
          this.scanRepeatActivity = 'scan';
          this.pushToScanPage(this.attendanceData);
        }else if(data == '1'){
          this.scanRepeatActivity = 'string';
          this.pushToScanPage(this.attendanceData);
        }else{
          console.log('error');
        }
      }
    });
    alert.present();
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

  public checkGroupCount(course){
    this.isCheckGroupCount = true;
    console.log(course);
  }





}
