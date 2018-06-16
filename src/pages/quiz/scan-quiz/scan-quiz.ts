import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController, ModalController } from 'ionic-angular';
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { AttendancePage } from '../../attendance/attendance';
import { AttendanceService } from '../../../services/attendance.service'
import { AngularFireAuth } from 'angularfire2/auth';
import { AuthServiceProvider } from '../../../services/auth.service';
import { AngularFireDatabase } from 'angularfire2/database';
import moment from 'moment';
import { QuizModalPage } from '../quiz-modal/quiz-modal';
import { QuizModalPersonPage } from '../quiz-modal-person/quiz-modal-person';

@IonicPage()
@Component({
  selector: 'page-scan-quiz',
  templateUrl: 'scan-quiz.html',
})
export class ScanQuizPage {
  course_id : String;
  activity : any;
  dataList : any;
  quiz_id : any;
  //Model & List
  studentList : any;
  courseList : any;
  scheduleQuizList : any;
  studentDataList : any;
  // Val
  studentCount : any;
  isToggled: boolean = false;
  totalScore : Number;
  quizDataList : any;
  scoreSelect : Number;
  scanKey : String;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private barcodeScanner: BarcodeScanner,
    public viewCtrl: ViewController,
    //private attendance: AttendanceService,
    public alertCtrl: AlertController,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    public modalCtrl: ModalController) {

      this.dataList = {};
      this.scanKey = '';
      this.activity = navParams.get('activity');
      this.course_id = navParams.get('course_id');
      this.dataList = navParams.get('dataList');
      this.quiz_id = this.dataList.quiz_id;
      this.totalScore = this.dataList.totalScore;
      this.scoreSelect = this.dataList.scoreSelect;
      this.scanKey = this.dataList.key;
      this.quizDataList = {};
      this.scheduleQuizList = [];
      this.studentDataList = [];
      console.log(this.dataList);
      console.log(this.scanKey)

      const coursePath = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}`;
      const studentPath = `users/${this.auth.currentUserId()}/course/${this.course_id}/students`;

      //Query scheduleQuizList
      this.db.list(coursePath).snapshotChanges().map(actions => {
        return actions.map(action => ({ key: action.key, ...action.payload.val() }));
          }).subscribe(items => {
        this.scheduleQuizList = items;
        console.log(this.scheduleQuizList);
        return items.map(item => item.key);
      });

    //Query Student
      this.db.list(studentPath).snapshotChanges().map(actions => {
        return actions.map(action => ({ key: action.key, ...action.payload.val() }));
          }).subscribe(items => {
        this.studentList = items;
        this.studentCount = this.studentList.length;
        console.log(this.studentList);
          return items.map(item => item.key);
      });

      if(this.scanKey == 'person'){
        this.scanPerson(this.quiz_id);
      }else if(this.scanKey== 'set'){
        this.scanSet(this.quiz_id);
      }else if(this.scanKey == 'stringPerson'){
        this.doCreateRepeatString(this.quiz_id);
      }else{
        console.log('error');
      }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScanQuizPage');
  }

  public closeModal(){
    //this.checkQuiz('B5800018',this.quiz_id)
    this.viewCtrl.dismiss('close');
  }

  public scanOption = {
    showTorchButton : true,
    prompt : "ให้ตำแหน่งของ barcode อยู่ภายในพื้นที่ scan",
    disableSuccessBeep: false,
    resultDisplayDuration : 1500,
    orientation : "portrait",
  };

  public scanPerson(id){
    console.log('scanPerson'+id);
    this.barcodeScanner.scan(this.scanOption).then((barcodeData) => {
      if (!barcodeData.cancelled) {
        let stdFlag = this.checkStudentClass(barcodeData.text,id);
        if(stdFlag){
          this.checkQuizPerson(barcodeData.text,id); 
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

  public scanSet(id){
    this.barcodeScanner.scan(this.scanOption).then((barcodeData) => {
      if (!barcodeData.cancelled) {
        let stdFlag = this.checkStudentClass(barcodeData.text,id);
        if(stdFlag){
          this.checkQuizSet(barcodeData.text,id); 
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

  public doCreateRepeatString(id) {
    let prompt = this.alertCtrl.create({
      title: 'ป้อนรหัสนักศึกษา',
      //message: "คะแนนสำหรับนักศึกษา<br>สามารถแก้ไข คะแนนที่ได้เมนู SETTING",
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
            let stdFlag = this.checkStudentClass(data.stdId,id);
            if(stdFlag){
              this.checkQuizPerson(data.stdId,id); 
              this.closeModal();
            }else{
              this.errorStudentFlag(id);
            }
          }
        }
      ]
    });
    prompt.present();
  }

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

  checkQuizSet(barcodeDataText, quiz_id){
    let countScan;
    for(var i=0 ; i<this.scheduleQuizList.length ; i++){
      console.log(this.scheduleQuizList);
      console.log('Here');
      if(quiz_id == this.scheduleQuizList[i].key){
        console.log('Here2');
        countScan = this.scheduleQuizList[i].count;
        if(this.scheduleQuizList[i].checked != undefined){
          if(barcodeDataText in this.scheduleQuizList[i].checked){
            console.log('duplicate');
            this.confirmUpdateScore(barcodeDataText, quiz_id, countScan);
          }else{
            console.log('scan');
            i//f(this.scanKey == 'person'){
            //  this.insertScoreModal(barcodeDataText, quiz_id,countScan)
            //}else if(this.scanKey == 'set'){
              this.updateQuiz(quiz_id, barcodeDataText, countScan);
              this.scanSet(quiz_id);
            //}
          }
        }else{
          console.log('scan');
          //if(this.scanKey == 'person'){
          //  this.insertScoreModal(barcodeDataText, quiz_id,countScan)
          //}else if(this.scanKey == 'set'){
            //console.log('update '+ this.dataList.key)
            this.updateQuiz(quiz_id, barcodeDataText, countScan);
            this.scanSet(quiz_id);
          //}
        }
      }
    }
  }

  checkQuizPerson(barcodeDataText, quiz_id){
    let countScan;
    for(var i=0 ; i<this.scheduleQuizList.length ; i++){
      console.log(this.scheduleQuizList);
      console.log('Here');
      if(quiz_id == this.scheduleQuizList[i].key){
        console.log('Here2');
        countScan = this.scheduleQuizList[i].count;
        if(this.scheduleQuizList[i].checked != undefined){
          if(barcodeDataText in this.scheduleQuizList[i].checked){
            console.log('duplicate');
            this.confirmUpdateScore(barcodeDataText, quiz_id, countScan);
          }else{
            console.log('scan');
            //if(this.scanKey == 'person'){
              this.insertScoreModal(barcodeDataText, quiz_id,countScan)
            //}else if(this.scanKey == 'set'){
            //  this.updateQuiz(quiz_id, barcodeDataText, countScan);
            //  this.scanSet(quiz_id);
            //}
          }
        }else{
          console.log('scan');
          //if(this.scanKey == 'person'){
            this.insertScoreModal(barcodeDataText, quiz_id,countScan)
          //}else if(this.scanKey == 'set'){
            //console.log('update '+ this.dataList.key)
            //this.updateQuiz(quiz_id, barcodeDataText, countScan);
            //this.scanSet(quiz_id);
          //}
        }
      }
    }
  }

  errorStudentFlag(id) {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'ไม่มีรหัสนักศึกษา ในคลาสนี้',
      buttons: [{
        text: 'OK',
        handler: () => {
          if(this.scanKey == 'person'){
            this.scanPerson(id);
          }else if(this.scanKey == 'set'){
            this.scanSet(id)
          }else if(this.scanKey == 'stringPerson'){
            this.doCreateRepeatString(id);
          }
        }}
      ]
    });
    alert.present();
  }

  confirmUpdateScore(barcodeDataText,id, countScan) {
    let alert = this.alertCtrl.create({
      title: "มีคะแนน "+this.activity.name+" ของนักศึกษาคนนี้แล้ว",
      message: 'ต้องการอัพเดทข้อมูลหรือไม่ ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            if(this.scanKey == 'person'){
              this.scanPerson(id);
            }else if(this.scanKey == 'set'){
              this.scanSet(id)
            }else if(this.scanKey == 'stringPerson'){
              this.closeModal();
            }
          }
        },
        {
          text: 'Update',
          handler: () => {
            console.log('Update clicked');
            if(this.scanKey == 'person'){
              //this.scanPerson(id);
              this.insertScoreModal(barcodeDataText, id, countScan-1);
            }else if(this.scanKey == 'set'){
              this.updateQuiz(id, barcodeDataText, countScan-1);
              this.scanSet(id);
            }else if(this.scanKey == 'stringPerson'){
              this.insertScoreModal(barcodeDataText, id, countScan-1);
            }
          }
        }
      ]
    });
    alert.present();
  }

  insertScoreModal(barcodeData, quiz_id, countScan){
    console.log('insertScoreModal');
    this.quizDataList = 
      { course_id : this.course_id,
        quiz_id: quiz_id,
        barcodeData: barcodeData,
        countScan : countScan,
        activity : this.activity,
        totalScore: this.totalScore
      };
    console.log(this.quizDataList); 
    let profileModal = this.modalCtrl.create(QuizModalPersonPage, { 
      quizDataList: this.quizDataList 
    });
    profileModal.onDidDismiss(data => {
      if(this.scanKey == 'stringPerson'){
        this.closeModal();
      }else{
        this.scanPerson(quiz_id);
      }
    });
    profileModal.present();
  }

  updateQuiz(id, barcodeDataText, countScan){
    let scoreNo = Number(this.scoreSelect);
    countScan = countScan+1;

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${id}`)
    .update({
      count : countScan,
    });
    
    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${barcodeDataText}/${this.activity.id}/${id}`)
      .update({
        score : scoreNo,
        date : Date(),
      });

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${id}/checked/${barcodeDataText}`)
      .set({
        id : barcodeDataText,
    });

  }
  
  


}
