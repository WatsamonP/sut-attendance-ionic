import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
import moment from 'moment';
import { AttendanceService } from '../../../services/attendance.service'

@Component({
  selector: 'page-manage-attendance',
  templateUrl: 'manage-attendance.html',
})
export class ManageAttendancePage {

  course_id : String;
  scheduleAttendanceList: any;
  studentList : any;
  lateIndex : any;
  lateItem :any
  //
  lateTime : any;
  lateScore : any;
  onTimeScore : any;
  leaveScore : any;
  createFlag : boolean;
  settingFlag : boolean;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public alertCtrl: AlertController,
    private attendance: AttendanceService) {

      let today = moment().add(10, 'minutes');
      this.lateTime = moment(today).format();
      this.course_id = navParams.get('course_id');
      this.scheduleAttendanceList = navParams.get('scheduleAttendanceList');
      this.studentList = navParams.get('studentList');
      this.lateIndex = navParams.get('lateIndex');
      this.lateItem = navParams.get('lateItem');

      if(this.lateIndex != undefined && this.lateItem != undefined){
        this.lateTime = this.lateItem.lateTime;
        this.lateScore = this.lateItem.lateScore;
        this.onTimeScore = this.lateItem.onTimeScore;
        this.leaveScore = this.lateItem.leaveScore;
        this.settingFlag = true;
        this.createFlag = false;
      }else{
        this.createFlag = true;
        this.settingFlag = false;
       }
     
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ManageAttendancePage');
  }

  public closeModal(){
    this.viewCtrl.dismiss('close');
  }

  public onClick_SaveAttendanceSetting(){
    //let d1 = new Date(this.lateTime), d2 = new Date(d1);
    //d2.setMinutes ( d1.getMinutes() + 10 );
    //this.lateTime = d2;
    //console.log(this.lateTime);
 
    if(this.lateScore == undefined){
      this.lateScore = '0.5';
    }
    if(this.onTimeScore == undefined){
      this.onTimeScore = '1';
    }
    if(this.leaveScore == undefined){
      this.leaveScore = '1';
    }
    let score = { lateScore: this.lateScore,
                  onTimeScore: this.onTimeScore,
                  leaveScore: this.leaveScore
                }
    //
    if(Number(this.lateScore) > Number(this.onTimeScore)){
      this.errorScoreAlert();
    }else if(Number(this.leaveScore) > Number(this.onTimeScore)){
      this.errorScoreAlert();
    }else{
      this.attendance.createDefaultAttendance(this.course_id,this.studentList, this.lateTime,score);
      this.viewCtrl.dismiss(this.attendance.getAttendance_id());
    }
  }



  public onClick_SaveSetting(){
    let updateData = {lateTime: this.lateTime,
      lateScore: this.lateScore,
      onTimeScore: this.onTimeScore,
      leaveScore: this.leaveScore
    }
    if(Number(this.lateScore) > Number(this.onTimeScore)){
      this.errorScoreAlert();
    }else if(Number(this.leaveScore) > Number(this.onTimeScore)){
      this.errorScoreAlert();
    }else{
      this.attendance.saveSetting(this.course_id,this.lateIndex,updateData);
      this.closeModal();
    }
  }

  errorScoreAlert() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'คะแนนเข้าเรียนสาย/ลา มากกว่าคะแนนเข้าเรียนตรงเวลา กรุณาแก้ไข',
      buttons: ['ตกลง']
    });
    alert.present();
  }


}
