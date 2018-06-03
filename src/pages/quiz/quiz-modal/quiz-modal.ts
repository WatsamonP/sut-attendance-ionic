import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController, Platform} from 'ionic-angular';
import { QuizPage } from '../quiz';
import { Student } from '../../../services/student.model';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthServiceProvider } from '../../../services/auth.service';
import moment from 'moment';
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { Identifiers } from '@angular/compiler';

@IonicPage()
@Component({
  selector: 'page-quiz-modal',
  templateUrl: 'quiz-modal.html',
})
export class QuizModalPage {
  //navParams
  course_id : String;
  status: String;
  quiz_id: String;
  group_id : string;
  activity : {id: '', name: ''};
  totalScore : Number;
  //Model & List
  studentList: Student[];
  scheduleQuizList: any;
  studentCount : Number;
  //Val
  scoreSelect : Number;
  scoreRangeArr : any = [];
  structure = {lower: 0, upper: 0};
  studentFlag: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private auth: AuthServiceProvider,
    private db: AngularFireDatabase,
    private barcodeScanner: BarcodeScanner,
    public alertCtrl: AlertController,
    public platform: Platform) {

      this.course_id = navParams.get('course_id');
      this.status = navParams.get('status');
      this.quiz_id = navParams.get('quiz_id');
      this.activity = navParams.get('activity');
      this.totalScore = navParams.get('totalScore');
      this.group_id = navParams.get('group_id');
      this.structure = {lower: 1, upper: 10};

      const coursePath = `users/${this.auth.currentUserId()}/course/${this.course_id}/group/${this.group_id}/schedule/${this.activity.id}`;
      const studentPath = `users/${this.auth.currentUserId()}/course/${this.course_id}/group/${this.group_id}/students`;

    //Query scheduleQuizList
    this.db.list(coursePath).snapshotChanges().map(actions => {
      return actions.map(action => ({ key: action.key, ...action.payload.val() }));
      }).subscribe(items => {
        this.scheduleQuizList = items;
        //this.totalScore = this.scheduleQuizList.totalScore;
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

      let temp = Number(this.structure.upper);
      for(var i=Number(this.structure.upper) ; i>=Number(this.structure.lower) ; i--){
        this.scoreRangeArr.push(temp);
        temp = temp-1;
      }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad QuizModalPage');
  }

  public update() {
    this.scoreRangeArr = [];
    let temp = Number(this.structure.upper);
    for(var i=Number(this.structure.upper) ; i>=Number(this.structure.lower) ; i--){
      this.scoreRangeArr.push(temp);
      temp = temp-1;
    }
  }

  dismiss() {   // for back to QuizPage
    let data = this.scoreSelect;
    this.viewCtrl.dismiss(data);
  }

  public closeModal(){
    this.viewCtrl.dismiss('close');
  }

  /////////////////////////////////////////////////////////////////////
  // ON Click Scan
  /////////////////////////////////////////////////////////////////////
  public onClickScan(){
    if(this.scoreSelect == undefined || this.scoreSelect == null ){
      this.alertErrorScore();
    }else if(this.scoreSelect <= 0){
      this.alertErrorMinusScore();
    }else if(Number(this.scoreSelect) > Number(this.totalScore)){
      this.alertErrorTotalScore();
    }else{
      //this.totalScoreSet();
      if(this.status == '0'){
        console.log('toCreate');
        this.createNewQuiz();
      }else if(this.status == '1'){
        console.log('toRepeat'+this.quiz_id);
        this.scanQR(this.quiz_id);
      }
    }
  }

  /////////////////////////////////////////////////////////////////////
  // Alert
  /////////////////////////////////////////////////////////////////////
  alertErrorScore() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'กรุณากรอกคะแนน',
      buttons: ['OK']
    });
    alert.present();
  }
  alertErrorMinusScore() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: 'คะแนนต้องเป็นจำนวนบวก และมากกว่า 0 กรุณาแก้ไข',
      buttons: ['OK']
    });
    alert.present();
  }
  alertErrorTotalScore() {
    let alert = this.alertCtrl.create({
      title: 'ERROR !',
      subTitle: this.scoreSelect+"/"+this.totalScore+"<br>คะแนนที่กำหนด ห้ามมากกว่าคะแนนเต็ม",
      buttons: ['OK']
    });
    alert.present();
  }
  confirmUpdateScore(id, barcodeDataText, countScan) {
    let alert = this.alertCtrl.create({
      title: 'มีคะแนน Quiz ของ '+ barcodeDataText +' แล้ว',
      message: 'ต้องการอัพเดทข้อมูลหรือไม่ ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            this.scanQR(id);
          }
        },
        {
          text: 'Update',
          handler: () => {
            console.log('Buy clicked');
            this.updateQuiz(id, barcodeDataText, countScan-1);
            this.scanQR(id);
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
          this.scanQR(id);
        }}
      ]
    });
    alert.present();
  }

  totalScoreSet() {
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
            this.totalScore = data.totalScoreSet;
          }
        }
      ]
    });
    prompt.present();
  }

  /////////////////////////////////////////////////////////////////////
  // Set Default 
  /////////////////////////////////////////////////////////////////////
  createNewQuiz(){
    let dateId = moment().format("DD-MM-YYYY-HH-mm-ss"); 

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/group/${this.group_id}/schedule/${this.activity.id}/${dateId}`)
        .update({
          id : dateId,
          date : Date(),                                                         
          count : 0,
          totalScore : this.totalScore
      });
    // Set 0 Score
    for(var i=0 ; i<this.studentList.length ; i++){
      this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/group/${this.group_id}/students/${this.studentList[i].id}/${this.activity.id}/${dateId}`)
        .update({
          score : 0,
      });
    }
 
    // then Scan
    this.scanQR(dateId);
  }

  updateQuiz(id, barcodeDataText, countScan){
    let scoreNo = Number(this.scoreSelect);
    countScan = countScan+1;

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/group/${this.group_id}/schedule/${this.activity.id}/${id}`)
    .update({
      count : countScan,
    });
    
    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/group/${this.group_id}/students/${barcodeDataText}/${this.activity.id}/${id}`)
      .update({
        score : scoreNo,
        date : Date(),
      });

    this.db.object(`users/${this.auth.currentUserId()}/course/${this.course_id}/group/${this.group_id}/schedule/${this.activity.id}/${id}/checked/${barcodeDataText}`)
      .set({
        id : barcodeDataText,
    });
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

  checkQuiz(barcodeDataText, id){
    let countScan;
    for(var i=0 ; i<this.scheduleQuizList.length ; i++){
      if(id == this.scheduleQuizList[i].key){
        countScan = this.scheduleQuizList[i].count;
        if(this.scheduleQuizList[i].checked != undefined){
          if(barcodeDataText in this.scheduleQuizList[i].checked){
            console.log('duplicate');
            this.confirmUpdateScore(id, barcodeDataText, countScan);
          }else{
            console.log('scan');
            this.updateQuiz(id, barcodeDataText, countScan);
            this.scanQR(id);
          }
        }else{
          console.log('scan');
          this.updateQuiz(id,barcodeDataText, countScan);
          this.scanQR(id);
        }
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

    this.barcodeScanner.scan(this.scanOption).then((barcodeData) => {
      if (barcodeData.cancelled) {
        console.log("User cancelled the action!");
        return false;
      }

      let stdFlag = this.checkStudentClass(barcodeData.text,id);
      if(stdFlag){
        this.checkQuiz(barcodeData.text,id); 
      }else{
        this.errorStudentFlag(id);
      }

      /*
      if(barcodeData.cancelled==false){
        this.checkQuiz(barcodeData.text,id);
      }
      */
      
      console.log(barcodeData);

      }, (err) => {
        console.log(err);
    });
  }


  ///////////////////////

}
