import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, MenuController, App } from 'ionic-angular';
//import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthServiceProvider } from '../../services/auth.service';
import { AlertController } from 'ionic-angular';
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { Student } from '../../services/student.model';
import { Course } from '../../services/course.model';
import moment from 'moment';
import { HomePage } from '../home/home';

@IonicPage()
@Component({
  selector: 'page-attendance',
  templateUrl: 'attendance.html',
})
export class AttendancePage {
  //navParams
  course_id : string;
  course_name : string;
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
  // TIME
  today = moment().format("DD-MM-YYYY HH:mm"); 
  todayTime = moment().format("HH:mm"); 
  lateTemp = moment().add(3, 'minutes').format("HH:mm");
  lateHour : string;
  lateMinute : string;
  isToggled: boolean = false;
  studentFlag: boolean = false;
  //
  public scannedText: string;
  public buttonText: string;
  public loading: boolean;
 
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    public alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private platform: Platform,
    private menu: MenuController,
    public appCtrl: App) {

    this.course_id = navParams.get('course_id');
    this.course_name = navParams.get('course_name');

    const coursePath = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance`;
    const studentPath = `users/${this.auth.currentUserId()}/course/${this.course_id}/students`;
    this.isToggled = false;

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
   
  /////////////////////////////////////////////////////////////////////
  // ON MOUSE CLICK
  /////////////////////////////////////////////////////////////////////
  onClickCreate() {
    let prompt = this.alertCtrl.create({
      title: 'จัดการเวลา-คะแนน',
      message: "กำหนดเวลาเข้าเรียนสายและคะแนน <br> ค่าเริ่มต้น สาย : 0.5 | ตรงเวลา : 1<br>เวลาสาย +3 นาทีจากเวลาปัจจุบัน",
      inputs: [
        {
          name: 'lateTime',
          placeholder: 'เวลาเข้าเรียนสาย',
          type : 'time',
        },
        {
          name: 'lateScore',
          placeholder: 'คะแนนเข้าเรียนสาย',
          type: 'number',
        },
        {
          name: 'onTimeScore',
          placeholder: 'คะแนนเข้าเรียนตรงเวลา',
          type: 'number',
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            if(data.lateTime == ""){
              data.lateTime = this.lateTemp;
            }
            if(data.lateScore == ""){
              data.lateScore = '0.5';
            }
            if(data.onTimeScore == ""){
              data.onTimeScore = '1';
            }
            //////////////////////////////////////
            if(Number(data.lateScore) > Number(data.onTimeScore)){
              this.errorScoreAlert();
            }else{
              this.createNewAttendance(data.lateTime, data.lateScore, data.onTimeScore);
              console.log('Saved clicked');
            }
          }
        }
      ]
    });
    prompt.present();
  }

  onClickUpdateAttendance(id, item){
    this.lateTime = item.lateTime;
    this.lateScore = item.lateScore;
    this.onTimeScore = item.onTimeScore;
    this.scanQR(id);
    //this.checkAttendance('B5800018', id);
  }

  onClickDelete(id : String){

    let path = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance/${id}`;
    this.db.object(path).remove();
    
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/attendance/${id}`)
        .remove();
    } 
  }

  onClickSetting(lateIndex, lateItem) {
    let prompt = this.alertCtrl.create({
      title: 'จัดการเวลา-คะแนน',
      message: "กำหนดเวลาเข้าและคะแนนสำหรับการเข้าเรียนสาย",
      inputs: [
        {
          name: 'lateTime',
          type : 'time',
          value : lateItem.lateTime,
        },
        {
          name: 'lateScore',
          placeholder: 'คะแนนเข้าเรียนสาย',
          type: 'number',
          value : lateItem.lateScore,
        },
        {
          name: 'onTimeScore',
          placeholder: 'คะแนนเข้าเรียนตรงเวลา',
          type: 'number',
          value : lateItem.onTimeScore,
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            if(Number(data.lateScore) > Number(data.onTimeScore)){
              this.errorScoreAlert();
            }else{
              this.saveSetting(lateIndex,data.lateTime,data.lateScore,data.onTimeScore);
            console.log('Saved clicked');
            }
          }
        }
      ]
    });
    prompt.present();
  }

  /////////////////////////////////////////////////////////////////////
  // ERROR
  /////////////////////////////////////////////////////////////////////
  errorScoreAlert() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'คะแนนเข้าเรียนสาย มากกว่าคะแนนเข้าเรียนตรงเวลา กรุณาแก้ไข',
      buttons: ['OK']
    });
    alert.present();
  }

  errorDuplicateData(id, barcodeDataText) {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'รหัส ' + barcodeDataText + ' ถูกสแกนแล้ว ไม่สามารถสแกนซ้ำได้',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.scanQR(id);
        }}
      ]
    });
    alert.present();
  }

  errorStudentFlag(id) {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'ไม่มีรหัสนักศึกษา ในคลาสนี้',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.scanQR(id);
        }}
      ]
    });
    alert.present();
  }

  showConfirmDelete(id) {
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
            this.onClickDelete(id);
            console.log('OK clicked');
          }
        }
      ]
    });
    confirm.present();
  }


  /////////////////////////////////////////////////////////////////////
  // Set Default 
  /////////////////////////////////////////////////////////////////////
  createNewAttendance(lateTime, lateScore, onTimeScore){
    this.lateTime = lateTime;
    this.lateScore = lateScore;
    this.onTimeScore = onTimeScore;
    let dateId = moment().format("DD-MM-YYYY-HH-mm-ss"); 
    console.log(this.studentCount);

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance/${dateId}`)
        .update({
          id : dateId,
          date : Date(),                                                         
          lateTime : lateTime,
          lateScore : lateScore,
          onTimeScore : onTimeScore,
          countLate : 0,
          countMiss : this.studentCount,
          countOnTime : 0,
      });
    // Set 0 Score
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/attendance/${dateId}`)
        .update({
          score : 0,
          status : 'Missed Class',
      });
    }
 
    // then Scan
    this.scanQR(dateId);
  }

  /////////////////////////////////////////////////////////////////////
  // Function
  /////////////////////////////////////////////////////////////////////
  checkStudentClass(barcodeDataText,id){
    for(var i=0 ; i<this.studentList.length ; i++){
      if(barcodeDataText == this.studentList[i].id){
        //alert('found'+barcodeDataText +' = ' + this.studentList[i].id);
        //console.log('found')
        this.studentFlag = true;
        break;
      }else{
        //alert('not found');
        this.studentFlag = false;
        continue;
        //this.errorStudentFlag(id);
      }
    }
    return this.studentFlag;
  }
  checkAttendance(barcodeDataText, id){
    this.calculateTime();
    let countLate;
    let countMiss;
    let countOnTime;

    ///////////////////////////////////////
    for(var i=0 ; i<this.scheduleAttendanceList.length ; i++){
      if(id == this.scheduleAttendanceList[i].key){
        countLate = this.scheduleAttendanceList[i].countLate;
        countMiss = this.scheduleAttendanceList[i].countMiss;
        countOnTime = this.scheduleAttendanceList[i].countOnTime;

        if(this.scheduleAttendanceList[i].checked != undefined){
          if(barcodeDataText in this.scheduleAttendanceList[i].checked){
            console.log('duplicate');
            this.errorDuplicateData(id, barcodeDataText);
          }else{
            //alert("SCAN : " + barcodeDataText);
            this.updateAttendance(id,countLate,countMiss,countOnTime,barcodeDataText);
          }
        }else{
          //alert("SCAN : " + barcodeDataText);
          this.updateAttendance(id,countLate,countMiss,countOnTime,barcodeDataText);
        }
      }
    }
  }

  updateAttendance(id,countLate,countMiss,countOnTime, barcodeDataText){
    let scoreNo = Number(this.attendance_score);

    if(this.attendance_status=='Late'){
      countLate = countLate+1;
      countMiss = countMiss-1;
    }else if(this.attendance_status=='onTime'){
      countOnTime = countOnTime+1;
      countMiss = countMiss-1;
    }

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance/${id}`)
    .update({
      countLate : countLate,
      countMiss : countMiss,
      countOnTime : countOnTime
    });

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${barcodeDataText}/attendance/${id}`)
      .update({
        score : scoreNo,
        date : Date(),
        status : this.attendance_status,
      });

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance/${id}/checked/${barcodeDataText}`)
      .set({
        id : barcodeDataText,
    });
    /////////////////////////////////
    this.scanQR(id); 
  }

  saveSetting(id, lateTime, lateScore, onTimeScore){
    this.lateTime = lateTime;
    this.lateScore = lateScore;
    this.onTimeScore = onTimeScore;
    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance/${id}`)
        .update({
          lateTime : lateTime,
          lateScore : lateScore,
          onTimeScore : onTimeScore
      });
  }

  calculateTime(){
    let currentHour = new Date().getHours();
    let currentMinute = new Date().getMinutes();
    const dateParts = this.lateTime.split(":");
    let lateHour = Number(dateParts[0]);
    let lateMinute = Number(dateParts[1]);
    if (currentHour > lateHour) {
      this.attendance_status = 'Late';
      this.attendance_score = this.lateScore;
    }else{
      if(currentMinute > lateMinute){
        this.attendance_status = 'Late';
        this.attendance_score = this.lateScore;
      }else if(currentMinute <= lateMinute){
        this.attendance_status = 'onTime';
        this.attendance_score = this.onTimeScore;
      }
    }
  }


  /////////////////////////////////////////////////////////////////////
  // Scan
  /////////////////////////////////////////////////////////////////////
  public scanOption = {
    showTorchButton : true,
    prompt : "ให้ตำแหน่งของ barcode อยู่ภายในพื้นที่ scan",
    disableSuccessBeep: false,
    resultDisplayDuration : 1500
  };


  public scanQR(id) {
    //this.buttonText = "Loading..";
    //this.loading = true;

    this.barcodeScanner.scan(this.scanOption).then((barcodeData) => {
      if (barcodeData.cancelled) {
        console.log("User cancelled the action!");
        this.navCtrl.getViews();
        //this.navCtrl.getActive().AttendancePage({});
        /*
        this.appCtrl.getActive()(AttendancePage, {
          course_id: this.course_id,
          course_name: this.course_name
        });
        */
        return false;
      }

      let stdFlag = this.checkStudentClass(barcodeData.text,id);
      if(stdFlag){
        this.checkAttendance(barcodeData.text,id); 
      }else{
        this.errorStudentFlag(id);
      }

      //this.checkAttendance(barcodeData.text,id);
      
      console.log(barcodeData);
      //this.goToResult(barcodeData);
      }, (err) => {
        console.log(err);
    });
  }


  /////////////////////////////////////////////////////////////////////
}
