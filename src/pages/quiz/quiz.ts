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
import { QuizModalPage } from './quiz-modal/quiz-modal';
import { QuizModalPersonPage } from './quiz-modal-person/quiz-modal-person';
import { ScanQuizPage } from './scan-quiz/scan-quiz';

@Component({
  selector: 'page-quiz',
  templateUrl: 'quiz.html',
})
export class QuizPage {
  //navParams
  course_id : string;
  course_name : string;
  activity : {id: '',name: ''};
  pic : any;
  //Model & List
  studentList: Student[];
  courseList : Course[];
  scheduleQuizList : any;
  studentDataList : any;
  // Val
  studentCount : any;
  isToggled: boolean = false;
  studentFlag: boolean = false;
  totalScore : Number;
  dataList : any;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    public alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private platform: Platform,
    private menu: MenuController,
    public modalCtrl: ModalController) {

    this.course_id = navParams.get('course_id');
    this.course_name = navParams.get('course_name');
    this.activity = navParams.get('activity');
    this.pic = navParams.get('pic');
    const coursePath = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}`;
    const studentPath = `users/${this.auth.currentUserId()}/course/${this.course_id}/students`;
    this.isToggled = false;

    //Query scheduleQuizList
    this.db.list(coursePath).snapshotChanges().map(actions => {
      return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      }).subscribe(items => {
        this.scheduleQuizList = items;
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

  public notify() {
    console.log("Toggled: "+ this.isToggled); 
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
  // FOR CREATE NEW
  public onClick_CreateScanSet(){  // Score -> Scan
    this.setTotalScore('set');
  }


  public onClick_CreateScanPerson(){  // Scan -> Score
    this.setTotalScore('person');
  }

  onClick_ScanUpdateSet(id,totalScore){
    let quizModal = this.modalCtrl.create(QuizModalPage, { 
      status : '1',
      course_id: this.course_id,
      course_name: this.course_name,
      quiz_id: id,
      activity : this.activity,
      totalScore: totalScore
    });
    quizModal.present();
 
  }

  onClick_ScanUpdatePerson(id,totalScore){
    this.dataList = {totalScore:totalScore, quiz_id:id, key:'person'};
    /*
    let quizModal = this.modalCtrl.create(QuizModalPage, { 
      status : '1',
      course_id: this.course_id,
      activity : this.activity,
      totalScore: this.totalScore
    });
    quizModal.present();
    */
   this.pushToScanPage(this.dataList);
  }

  onClick_StringUpdatePerson(id,totalScore){
    this.dataList = {totalScore:totalScore, quiz_id:id, key:'stringPerson'};
    this.pushToScanPage(this.dataList);
  }

  public onClick_ScanRepeat(id, item){
    console.log(item.totalScore);
    let alert = this.alertCtrl.create();
    alert.setTitle('Scan Option');
    alert.addInput({ type: 'radio',label: 'สแกนเป็นชุด',value: '0',checked: false});
    alert.addInput({ type: 'radio',label: 'สแกนรายบุคคล',value: '1',checked: false});
    alert.addInput({ type: 'radio',label: 'ป้อนรหัสนักศึกษา',value: '2',checked: false});
    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        if(data == '0'){
          this.onClick_ScanUpdateSet(id,item.totalScore);
        }else if(data == '1'){
          this.onClick_ScanUpdatePerson(id,item.totalScore);
        }else if(data == '2'){
          this.onClick_StringUpdatePerson(id,item.totalScore);
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
            console.log('OK clicked');
            this.deleteQuiz(id);
          }
        }
      ]
    });
    confirm.present();
  }
  deleteQuiz(id : String){
    let path = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${id}`;
    this.db.object(path).remove();
    
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/${this.activity.id}/${id}`)
        .remove();
    } 
  }

  public onClick_Setting(id, item){
    let prompt = this.alertCtrl.create({
      title: 'จัดการคะแนน',
      message: "กำหนดคะแนนเต็มสำหรับ "+this.activity.name+" นี้<br>หากไม่กำหนดระบบจำกำหนดอัตโนมัติ 10 คะแนน",
      inputs: [
        {
          name: 'totalScore',
          type : 'number',
          value : item.totalScore,
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
            if(data.totalScore == undefined || data.totalScore == 0 || data.totalScore == null){
              data.totalScore = 10;
            }
            this.saveSetting(id,data.totalScore);
          }
        }
      ]
    });
    prompt.present();
  }
  saveSetting(id, totalScore){
    this.totalScore = Number(totalScore);
    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${id}`)
        .update({
          totalScore : this.totalScore,
      });
  }

  pushToScanPage(dataList){
    let scan = this.modalCtrl.create(ScanQuizPage, 
      { 
        activity : this.activity,
        course_id : this.course_id,
        dataList : dataList,
    });

    scan.onDidDismiss(data => {
      console.log(data);
    });
    scan.present();
  }

  ///////////////////////////////////////////////////////////////////////////////
  setTotalScore(state) {
    let prompt = this.alertCtrl.create({
      title: 'จัดการคะแนน',
      message: "กำหนดคะแนนเต็มสำหรับ "+this.activity.name+" นี้<br>ค่าเริ่มต้น 10 คะแนน",
      inputs: [{name: 'totalScore', type : 'number', value : ''}],
      buttons: [
        { text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            if(data.totalScore == 0){
              this.totalScore = 10
            }else{
              this.totalScore = data.totalScore;
            }
            if(state == 'set'){
              let quizModal = this.modalCtrl.create(QuizModalPage, { 
                status : '0',
                course_id: this.course_id,
                activity : this.activity,
                totalScore: this.totalScore
              });
              quizModal.present();
            }else if(state == 'person'){
              this.doCreateScanPerson();
            }else{
              console.log('error');
            }
          }
        }
      ]
    });
    prompt.present();
  }

  /////////////////////////////////////////////////////////////////////
  // Set Default For Scan Person - สแกน+คะแนน รายบุคคล
  /////////////////////////////////////////////////////////////////////
  doCreateScanPerson(){
    let totalScore = Number(this.totalScore);
    let dateId = moment().format("DD-MM-YYYY-HH-mm-ss"); 
    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${dateId}`)
        .update({
          id : dateId,
          date : Date(),                                                         
          count : 0,
          totalScore : totalScore
      });
    // Set 0 Score
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/${this.activity.id}/${dateId}`)
        .update({
          score : 0,
      });
    }
    
    this.dataList = {totalScore:totalScore, quiz_id:dateId, key:'person'};
    this.pushToScanPage(this.dataList)
  }























/*

  /////////////////////////////////////////////////////////////////////
  // FOR UPDATE
  public onClickScanQuiz(id, item){ //toUpdate
    this.selectScanOptionAlert(id);
  }
  public onClickCreateScanUpdateOption0(quiz_id){  // Score -> Scan
    let quizModal = this.modalCtrl.create(QuizModalPage, { 
      status : '1',
      course_id: this.course_id,
      course_name: this.course_name,
      quiz_id: quiz_id,
      activity : this.activity,
      totalScore: this.totalScore
    });
    quizModal.present();
  }
  public onClickCreateScanUpdateOption1(quiz_id){  // Scan -> Score
    this.scanOption1(quiz_id);
    //this.insertScoreModal(quiz_id, 'B5800032');
  }
  /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  onClickDelete(id) {
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
            console.log('OK clicked');
            this.deleteQuiz(id);
          }
        }
      ]
    });
    confirm.present();
  }

  onClickSetting(quiz_id, item) {
    let prompt = this.alertCtrl.create({
      title: 'จัดการคะแนน',
      message: "กำหนดคะแนนเต็มสำหรับ "+this.activity.name+" นี้<br>หากไม่กำหนดระบบจำกำหนดอัตโนมัติ 10 คะแนน",
      inputs: [
        {
          name: 'totalScore',
          type : 'number',
          value : item.totalScore,
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
            if(data.totalScore == undefined || data.totalScore == '' || data.totalScore == null){
              data.totalScore = 10;
            }
            this.saveSetting(quiz_id,data.totalScore);
          }
        }
      ]
    });
    prompt.present();
  }

  saveSetting(id, totalScore){
    this.totalScore = Number(totalScore);
    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${id}`)
        .update({
          totalScore : this.totalScore,
      });
  }

  totalScoreSet(state) {
    let prompt = this.alertCtrl.create({
      title: 'จัดการคะแนน',
      message: "กำหนดคะแนนเต็มสำหรับ "+this.activity.name+" นี้",
      inputs: [
        {
          name: 'totalScore',
          type : 'number',
          value : '',
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
            this.totalScore = data.totalScore;
            if(state == '0'){
              let quizModal = this.modalCtrl.create(QuizModalPage, { 
                status : '0',
                course_id: this.course_id,
                activity : this.activity,
                totalScore: this.totalScore
              });
              quizModal.present();
            }else if(state == '1'){
              this.crateScanOption1();
            }else{
              console.log('error');
            }
          }
        }
      ]
    });
    prompt.present();
  }

  /////////////////////////////////////////////////////////////////////
  // Alert
  /////////////////////////////////////////////////////////////////////
  selectScanOptionAlert(quiz_id){
    let alert = this.alertCtrl.create();
    alert.setTitle('Scan Option');
    alert.addInput({ type: 'radio',label: 'สแกนเป็นชุด',value: '0',checked: false});
    alert.addInput({ type: 'radio',label: 'สแกนรายบุคคล',value: '1',checked: true});
    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        if(data == '0'){
          this.onClickCreateScanUpdateOption0(quiz_id);
        }else if(data == '1'){
          this.onClickCreateScanUpdateOption1(quiz_id);
        }
      }
    });
    alert.present();
  }

  confirmUpdateScore(id, barcodeDataText, countScan) {
    let alert = this.alertCtrl.create({
      title: "มีคะแนน "+this.activity.name+" ของนักศึกษาคนนี้แล้ว",
      message: 'ต้องการอัพเดทข้อมูลหรือไม่ ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            this.scanOption1(id);
          }
        },
        {
          text: 'Update',
          handler: () => {
            console.log('Update clicked');
            this.insertScoreModal(id, barcodeDataText, countScan-1);
          }
        }
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
          this.scanOption1(id);
        }}
      ]
    });
    alert.present();
  }

  /////////////////////////////////////////////////////////////////////
  // Set Default For Option1  - สแกน+คะแนน รายบุคคล
  /////////////////////////////////////////////////////////////////////
  crateScanOption1(){
    let totalScore = Number(this.totalScore);
    let dateId = moment().format("DD-MM-YYYY-HH-mm-ss"); 
    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${dateId}`)
        .update({
          id : dateId,
          date : Date(),                                                         
          count : 0,
          totalScore : totalScore
      });
    // Set 0 Score
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/${this.activity.id}/${dateId}`)
        .update({
          score : 0,
      });
    }
    //SCAN TEST
    this.scanOption1(dateId);
  }

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

  checkQuiz(barcodeDataText, quiz_id){
    let countScan;
    for(var i=0 ; i<this.scheduleQuizList.length ; i++){
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
            this.insertScoreModal(barcodeDataText, quiz_id,countScan)
          }
        }else{
          console.log('scan');
          this.insertScoreModal(barcodeDataText, quiz_id,countScan)
        }
      }
    }
  }

  public scanOption = {
    showTorchButton : true,
    prompt : "ให้ตำแหน่งของ barcode อยู่ภายในพื้นที่ scan",
    disableSuccessBeep: false,
    resultDisplayDuration : 1500
  };

  scanOption1(quiz_id) {
    this.barcodeScanner.scan(this.scanOption).then((barcodeData) => {

      if (!barcodeData.cancelled) {
        let stdFlag = this.checkStudentClass(barcodeData.text,quiz_id);
        if(stdFlag){
          this.checkQuiz(barcodeData.text,quiz_id); 
        }else{
          this.errorStudentFlag(quiz_id);
        }
      }else{
        this.navCtrl.push(QuizPage, {
          course_id: this.course_id,
          course_name: this.course_name,
          activity : this.activity
        }).then(() => {
          this.navCtrl.pop();
        })
        return false;
      }

      console.log(barcodeData);
      }, (err) => {
        console.log(err);
    });
  }
  
  insertScoreModal(barcodeData, quiz_id, countScan){
    console.log('insertScoreModal');
    let profileModal = this.modalCtrl.create(QuizModalPersonPage, { 
      course_id: this.course_id,
      quiz_id: quiz_id,
      barcodeData: barcodeData,
      countScan : countScan,
      activity : this.activity,
      totalScore: this.totalScore 
    });
      
    profileModal.onDidDismiss(data => {
      this.scanOption1(quiz_id);
    });
    profileModal.present();
  }

  /////////////////////////////////////////////////////////////////////
  // Function
  /////////////////////////////////////////////////////////////////////
  deleteQuiz(id : String){
    let path = `users/${this.auth.currentUserId()}/course/${this.course_id}/schedule/${this.activity.id}/${id}`;
    this.db.object(path).remove();
    
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/students/${this.studentList[i].id}/${this.activity.id}/${id}`)
        .remove();
    } 
  }
  */
}
