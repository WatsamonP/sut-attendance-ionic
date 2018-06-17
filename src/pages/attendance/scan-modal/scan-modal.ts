import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { AttendancePage } from '../../attendance/attendance';
import { AttendanceService } from '../../../services/attendance.service'
import { AngularFireAuth } from 'angularfire2/auth';
import { AuthServiceProvider } from '../../../services/auth.service';
import { AngularFireDatabase } from 'angularfire2/database';
import moment from 'moment';

@IonicPage()
@Component({
  selector: 'page-scan-modal',
  templateUrl: 'scan-modal.html',
})
export class ScanModalPage {
  course_id : String;
  activity : any;
  studentList : any;
  // Attendance
  scheduleAttendanceList : any;
  attendanceData : any;
  attendance_status : String;
  attendance_score : Number;
  dataList : any;
  lateTime : any;
  lateScore : any;
  onTimeScore : any;
  leaveScore : any;
  leaveActivity : any;
  scanRepeatActivity: any;
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private barcodeScanner: BarcodeScanner,
    public viewCtrl: ViewController,
    //private attendance: AttendanceService,
    public alertCtrl: AlertController,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase) {

      this.activity = navParams.get('activity');
      this.course_id = navParams.get('course_id');
      //this.attendance_status = navParams.get('attendance_status');
      this.attendanceData = navParams.get('attendanceData');
      this.leaveActivity = navParams.get('leaveActivity');
      this.scanRepeatActivity = navParams.get('scanRepeatActivity');
      this.lateTime = this.attendanceData.lateTime;
      this.lateScore = this.attendanceData.lateScore;
      this.onTimeScore = this.attendanceData.onTimeScore;
      this.leaveScore = this.attendanceData.leaveScore;
      
      this.attendance_status = '';
      this.attendance_score = null;

      const coursePath = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance`;
      const studentPath = `users/${this.auth.currentUserId()}/course/${this.course_id}/students`;

      this.db.list(studentPath).snapshotChanges().map(actions => {
        return actions.map(action => ({ key: action.key, ...action.payload.val() }));
        }).subscribe(items => {
          this.studentList = items;
          return items.map(item => item.key);
      });

      this.db.list(coursePath).snapshotChanges().map(actions => {
        return actions.map(action => ({ key: action.key, ...action.payload.val() }));
        }).subscribe(items => {
          this.scheduleAttendanceList = items;
          return items.map(item => item.key);
      });

      console.log(this.leaveActivity);
      console.log(this.scanRepeatActivity);

      if(this.leaveActivity != 'none'){
        if(this.leaveActivity == 'scan'){
          this.attendance_status = 'Leave';
          this.scanAttendance(this.attendanceData.id)
          //this.doCreateLeaveScan(this.attendanceData.id);
        }else if(this.leaveActivity == 'string'){
          this.doCreateLeaveString(this.attendanceData.id);
        }
      }else if(this.scanRepeatActivity != 'none'){
        if(this.scanRepeatActivity == 'scan'){
          this.scanAttendance(this.attendanceData.id)
          //this.doCreateLeaveScan(this.attendanceData.id);
        }else if(this.scanRepeatActivity == 'string'){
          this.doCreateLeaveString(this.attendanceData.id);
        }
      }else{
        this.scanAttendance(this.attendanceData.id)
      }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScanModalPage');
  }

  public closeModal(){
    this.viewCtrl.dismiss('close');
  }

  public scanOption = {
    showTorchButton : true,
    prompt : "ให้ตำแหน่งของ barcode อยู่ภายในพื้นที่ scan",
    disableSuccessBeep: false,
    resultDisplayDuration : 1500,
    orientation : "portrait",
  };

  public scanAttendance(id) {
    this.barcodeScanner.scan(this.scanOption).then((barcodeData) => {
      if (!barcodeData.cancelled) {

        let stdFlag = this.checkStudentClass(barcodeData.text,id);
        if(stdFlag){
          this.checkAttendance(barcodeData.text,id);
          //this.scanAttendance(id);
        }else{
          this.errorStudentFlag(id);
        }
        
      }else{
        this.viewCtrl.dismiss('close');
        return false;
      }


    },(err) => {
      console.log(err);
    });
  }

  //////////////////////////////////////////////////////////////////////
  checkStudentClass(barcodeDataText,id){
    let studentFlag = false;
    for(var i=0 ; i<this.studentList.length ; i++){
      if(barcodeDataText == this.studentList[i].id){
        studentFlag = true;
        break;
      }else{
        studentFlag = false;
        continue;
      }
    }
    return studentFlag;
  }

  checkAttendance(barcodeDataText, id){
    
    if(this.attendance_status == 'Leave'){
      this.attendance_score = this.leaveScore;
    }else{
      this.calculateTime();
    }
    let countLate, countMiss, countOnTime ,countLeave;

    ///////////////////////////////////////
    for(var i=0 ; i<this.scheduleAttendanceList.length ; i++){
      if(id == this.scheduleAttendanceList[i].key){
        countLate = this.scheduleAttendanceList[i].countLate;
        countMiss = this.scheduleAttendanceList[i].countMiss;
        countOnTime = this.scheduleAttendanceList[i].countOnTime;
        countLeave = this.scheduleAttendanceList[i].countLeave;

        if(this.scheduleAttendanceList[i].checked != undefined){
          if(barcodeDataText in this.scheduleAttendanceList[i].checked){
            console.log('duplicate');
            this.errorDuplicateData(id, barcodeDataText);
          }else{
            this.updateAttendance(id,countLate,countMiss,countOnTime,countLeave,barcodeDataText);
          }
        }else{
          this.updateAttendance(id,countLate,countMiss,countOnTime,countLeave,barcodeDataText);
        }
      }
    }
  }

  updateAttendance(id,countLate,countMiss,countOnTime,countLeave, barcodeDataText){
    let scoreNo = Number(this.attendance_score);
    if(this.attendance_status=='Late'){
      countLate = countLate+1;
      countMiss = countMiss-1;
    }else if(this.attendance_status=='onTime'){
      countOnTime = countOnTime+1;
      countMiss = countMiss-1;
    }else if(this.attendance_status=='Leave'){
      countLeave = countLeave+1;
      countMiss = countMiss-1;
    }

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/attendance/${id}`)
    .update({
      countLate : countLate,
      countMiss : countMiss,
      countOnTime : countOnTime,
      countLeave : countLeave,
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
    
    if(this.leaveActivity == 'string' || this.scanRepeatActivity == 'string'){
      //this.scanAttendance(id);
      console.log('success create leave student');
    }else{
      this.scanAttendance(id);
    }
    
  }


  calculateTime(){
    let currentDay = moment().format();
    if(currentDay > moment(this.lateTime).format()){
      console.log('Late');
      this.attendance_status = 'Late';
      this.attendance_score = this.lateScore;
    }else{
      console.log('Ontime');
      this.attendance_status = 'onTime';
      this.attendance_score = this.onTimeScore;
    }
  }

  doCreateLeaveString(id) {
    let prompt = this.alertCtrl.create({
      title: 'ป้อนรหัสนักศึกษา',
      message: "คะแนนสำหรับนักศึกษาที่ป่วยหรือลา<br>สามารถแก้ไข คะแนนที่ได้เมนู SETTING",
      inputs: [
        {
          name: 'stdId',
          placeholder: 'รหัสนักศึกษา',
          type : 'text',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            this.closeModal();
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            if(Number(this.leaveScore) > Number(this.onTimeScore)){
              this.errorScoreAlertLeave();
            }else{
              this.attendance_status = 'Leave';
              let stdFlag = this.checkStudentClass(data.stdId,id);
              if(stdFlag){
                this.checkAttendance(data.stdId,id); 
                this.closeModal();
              }else{
                this.errorStudentFlag(id);
              }
            }
          }
        }
      ]
    });
    prompt.present();
  }

  doCreateLeaveScan(id) {
    let prompt = this.alertCtrl.create({
      title: 'กำหนดคะแนน',
      message: "กำหนดคะแนนสำหรับนักศึกษาที่ป่วยหรือลา<br>ค่าเริ่มต้น 1",
      inputs: [
        {
          name: 'leaveScore',
          placeholder: 'คะแนน',
          type: 'number',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            this.closeModal();
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            if(Number(data.leaveScore) == 0){
              data.leaveScore = 0.5;
            }
            if(Number(this.leaveScore) > Number(this.onTimeScore)){
              this.errorScoreAlertLeave();
            }else{
              this.attendance_status = 'Leave';
              //this.scanQR(id);
              this.scanAttendance(id);
            }
          }
        }
      ]
    });
    prompt.present();
  }

  doCreateRepeatString(id) {
    let prompt = this.alertCtrl.create({
      title: 'ป้อนรหัสนักศึกษา',
      message: "คะแนนสำหรับนักศึกษา<br>สามารถแก้ไข คะแนนที่ได้เมนู SETTING",
      inputs: [
        {
          name: 'stdId',
          placeholder: 'รหัสนักศึกษา',
          type : 'text',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            this.closeModal();
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            if(Number(this.leaveScore) > Number(this.onTimeScore)){
              this.errorScoreAlertLeave();
            }else{
              let stdFlag = this.checkStudentClass(data.stdId,id);
              if(stdFlag){
                this.checkAttendance(data.stdId,id); 
                this.closeModal();
              }else{
                this.errorStudentFlag(id);
              }
            }
          }
        }
      ]
    });
    prompt.present();
  }

  errorScoreAlertLeave() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'คะแนนป่วย/ลา มากกว่าคะแนนเข้าเรียนตรงเวลา กรุณาแก้ไข',
      buttons: ['OK']
    });
    alert.present();
  }

























  ////////////////////////////////////////////////
  
  errorStudentFlag(id) {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'ไม่มีรหัสนักศึกษา ในคลาสนี้',
      buttons: [{
        text: 'OK',
        handler: () => {
          if(this.leaveActivity == 'string'){
            this.doCreateLeaveString(id);
          }else{
            this.scanAttendance(id);
          }
        }}
      ]
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
          //this.scanQR(id);
          this.scanAttendance(id);
        }}
      ]
    });
    alert.present();
  }
  

}
