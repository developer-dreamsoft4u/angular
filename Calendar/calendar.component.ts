import { Component, OnInit, ViewChild, TemplateRef, ViewEncapsulation, HostListener } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgbAlert, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SlotsService } from 'src/app/_services/slots.service';

import { CalendarOptions, EventClickArg, EventApi, EventInput } from '@fullcalendar/angular';
import { Event } from './event.model';
import { category, calendarEvents, createEventId } from './data';
import Swal from 'sweetalert2';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Calendar } from '@fullcalendar/core';
import { DatePipe } from '@angular/common';
import interactionPlugin from '@fullcalendar/interaction'; // for selectable
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { addMinutes, eachMinuteOfInterval, endOfDay, format, isEqual, isFuture, isSameDay, startOfDay, eachDayOfInterval } from 'date-fns';
import { AuthService } from 'src/app/_services/auth.service';
import { MastersService } from 'src/app/_services/masters.service';
import listPlugin from '@fullcalendar/list';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { RescheduleAppointmentModalComponent } from 'src/app/shared/modals/reschedule-appointment-modal/reschedule-appointment-modal.component';
import { AppointmentDetailsModalComponent } from 'src/app/shared/modals/appointment-details-modal/appointment-details-modal.component';
import { onKeyUp } from 'src/app/_helpers/app.functions';
import * as moment from 'moment';


@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class CalendarComponent implements OnInit {


  minDates = { year: 1950, month: 1, day: 1 };
  // bread crumb items
  breadCrumbItems: Array<{}>;
  @ViewChild('modalShow') modalShow: TemplateRef<any>;
  @ViewChild('editmodalShow') editmodalShow: TemplateRef<any>;
  // @ViewChild('reschedulemodalShow') reschedulemodalShow: TemplateRef<any>;
  error = '';
  success = '';
  formEditData: FormGroup;
  formRescheduleData: FormGroup;
  formTimingData: FormGroup;
  submitted = false;
  category: any[];
  newEventDate: any;
  editEvent: any;
  calendarEvents: any[];
  timeSlots: any[];
  calendarEvents1 = [];

  editData: any;
  fromTimeList: any;
  fromMinuteList: any;
  amPmList: any;

  fromAMPMText: any;
  toAMPMText: any;
  fromam: any;
  toam: any;
  // event form
  formData: FormGroup;
  startdatestr: any;
  enddatestr: any;
  currDate = new Date();
  currUserId: any;
  consultantSetting: any;
  calendarOptions: CalendarOptions;
  slot: any;
  currentEvents: any;
  calendarText: boolean;
  appointmentId: any;
  appointmentData: any;

  startEvents: any;
  endEvents: any;
  errorStartDateMessage: string;
  errorEndDateMessage: string;

  constructor(private route: ActivatedRoute, private appointmentService: AppointmentService, private router: Router,
    public modalService: NgbModal, public datepipe: DatePipe, private mastersService: MastersService,
    private formBuilder: FormBuilder, public datePipe: DatePipe, private SlotsService: SlotsService, private authService: AuthService) { }

  ngOnInit(): void {
    this.route.params.subscribe(({ appointmentId }) => {
      this.appointmentId = appointmentId;
    });
    this.currUserId = this.authService.currentUserValue.id;
    // this.getAppointmentById();
    this.GetConsultantSettinglist();

    this.breadCrumbItems = [{ label: 'Calendar', active: true }];
    this.formData = this.formBuilder.group({
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
    });

    this.formEditData = this.formBuilder.group({
      startDateEdit: ['', [Validators.required]],
      endDateEdit: ['', [Validators.required]],
    });

    // this.formRescheduleData = this.formBuilder.group({
    //   startDate: ['', [Validators.required]],
    //   endDate: ['', [Validators.required]],
    //   rescheduleReason: ['', [Validators.required]],
    //   slotStatus: [''],
    // });

    this.formTimingData = this.formBuilder.group({
      fromDate: ['', [Validators.required]],
      fromMinute: ['0', [Validators.required]],
      fromAMPM: ['0', [Validators.required]],
      fromTime: ['0', [Validators.required]],
      toDate: ['', [Validators.required]],
      toMinute: ['0', [Validators.required]],
      toAMPM: ['0', [Validators.required]],
      toTime: ['0', [Validators.required]],
    });

    //this.myPage = this;
    this.GetSlotsListByUserId();

    this.fromTimeList = [
      { id: "0", name: "HH" },
      { id: "01", name: "01" },
      { id: "02", name: "02" },
      { id: "03", name: "03" },
      { id: "04", name: "04" },
      { id: "05", name: "05" },
      { id: "06", name: "06" },
      { id: "07", name: "07" },
      { id: "08", name: "08" },
      { id: "09", name: "09" },
      { id: "10", name: "10" },
      { id: "11", name: "11" },
      { id: "12", name: "12" },
    ];

    this.amPmList = [

      { id: "0", name: "AM" },
      { id: "12", name: "PM" },
    ];

    this.fromMinuteList = [
      { id: "0", name: "MM" },
      { id: "00", name: "00" },
      { id: "30", name: "30" },
    ];
    // this.saveTiming();
    // this.fromAMPMText.name='AM';
    // this.toAMPMText.name='AM';
    this.fromam = 0;
    this.toam = 0;
    this.fc.fromAMPM.valueChanges.subscribe(selectedValue => {
      this.fromam = selectedValue;
      const fromAMPMText = this.amPmList.find(m => m.id == selectedValue);
      this.fromAMPMText = fromAMPMText;
    });
    this.fc.toAMPM.valueChanges.subscribe(selectedValue => {
      this.toam = selectedValue;
      const toAMPMText = this.amPmList.find(m => m.id == selectedValue);
      this.toAMPMText = toAMPMText;
    });
  }


  ///Date Filter 

  clearStartDateMessage(): any {
    this.errorStartDateMessage = "";
    return this.formTimingData.get('fromDate').reset();
  }
  clearEndDateMessage(): any {
    this.errorEndDateMessage = "";
    return this.formTimingData.get('toDate').reset();
  }
  StartDateFormatFilter(event: any) {
    this.errorStartDateMessage = "";
    var temp = onKeyUp(event);
    this.startEvents = event;
    this.errorStartDateMessage = temp['message'];
  }
  EndDateFormatFilter(event: any) {
    this.errorEndDateMessage = "";
    var temp = onKeyUp(event);
    this.endEvents = event;
    this.errorEndDateMessage = temp['message'];

  }

  ///End Date Filter
  /**
   * Event click modal show
   */
  handleEventClick(clickInfo: EventClickArg) {
     ;
    this.editEvent = clickInfo.event;
    this.SlotsService.GetSlotById(this.editEvent._def.publicId, this.currUserId)
      .subscribe(resp => {
        this.editData = resp.data;
        this.editEvent.startStr
        if (this.editEvent._def.ui.backgroundColor == "#B8860B") {
          Swal.fire(this.datepipe.transform(this.editData.startDateTime, 'MM/dd/yyyy  h:mm a'), 'The time or date has already passed.');
        }
        else if (this.editData.appointmentStatus == 'Awaiting') {
          this.openAppointmentDetailModal(this.editEvent._def.extendedProps.appointmentId,this.editData.appointmentStatus,this.datepipe.transform(this.editEvent.startStr, 'MM/dd/yyyy  h:mm a'));
        }
        else if (this.editData.appointmentStatus == 'Confirmed') {
          this.openAppointmentDetailModal(this.editEvent._def.extendedProps.appointmentId, this.editData.appointmentStatus,this.datepipe.transform(this.editEvent.startStr, 'MM/dd/yyyy  h:mm a'));
        }
        else if (this.editData.appointmentStatus == 'Completed') {
          //  Swal.fire(this.editData.appointmentStatus, 'Avaliablity is already Booked and ' + this.editData.appointmentStatus + '.');
          this.openAppointmentDetailModal(this.editEvent._def.extendedProps.appointmentId, this.editData.appointmentStatus,this.datepipe.transform(this.editEvent.startStr, 'MM/dd/yyyy  h:mm a'));
        }
        else if (this.editData.appointmentStatus == 'Canceled') {
          //  Swal.fire(this.editData.appointmentStatus, 'Avaliablity is ' + this.editData.appointmentStatus + ' by consultee.');
          this.openAppointmentDetailModal(this.editEvent._def.extendedProps.appointmentId, this.editData.appointmentStatus,this.datepipe.transform(this.editEvent.startStr, 'MM/dd/yyyy  h:mm a'));
        }
        else if (this.editData.appointmentStatus == 'Rejected') {
          //  Swal.fire(this.editData.appointmentStatus, 'Avaliablity is ' + this.editData.appointmentStatus + ' by you.');
          this.openAppointmentDetailModal(this.editEvent._def.extendedProps.appointmentId, this.editData.appointmentStatus,this.datepipe.transform(this.editEvent.startStr, 'MM/dd/yyyy  h:mm a'));
        }
        else {
          if (this.appointmentId > 0) {
            // this.formRescheduleData = this.formBuilder.group({
            //   startDate: this.datepipe.transform(this.editData.startDateTime, 'MM/dd/yyyy  h:mm a'),
            //   endDate: this.datepipe.transform(this.editData.endDateTime, 'MM/dd/yyyy  h:mm a'),
            //   rescheduleReason: ['', [Validators.required]],
            //   slotStatus: [''],
            // });
            // this.modalService.open(this.reschedulemodalShow);

            let startEndTime = {
              appointmentId: this.appointmentId,
              newSlotId: this.editEvent._def.publicId,
              startDate: this.datepipe.transform(this.editData.startDateTime, 'MM/dd/yyyy  h:mm a'),
              endDate: this.datepipe.transform(this.editData.endDateTime, 'MM/dd/yyyy  h:mm a'),
            };
            this.openRescheduleModal(startEndTime);
          }
          else {
            this.formEditData = this.formBuilder.group({
              startDateEdit: this.datepipe.transform(this.editData.startDateTime, 'MM/dd/yyyy  h:mm a'),
              endDateEdit: this.datepipe.transform(this.editData.endDateTime, 'MM/dd/yyyy  h:mm a'),
            });
            this.modalService.open(this.editmodalShow);
          }
        }
      });
  }

  get form() {
    return this.formData.controls;
  }

  get fc() {
    return this.formTimingData.controls;
  }

  openRescheduleModal(startEndTime) {
    const modalRef = this.modalService.open(RescheduleAppointmentModalComponent);
    modalRef.componentInstance.data = startEndTime;
    modalRef.closed.subscribe(result => {
    });
  }

  openAppointmentDetailModal(appointmentId, appointmentStatus,appointmentStartDateTime) {
    let params = {
      appointmentId: appointmentId,
      appointmentStatus: appointmentStatus,
      appointmentStartDateTime:appointmentStartDateTime
    }
    const modalRef = this.modalService.open(AppointmentDetailsModalComponent);
    modalRef.componentInstance.data = params;
    modalRef.closed.subscribe(result => {
    });
  }

  // get fcr() {
  //   return this.formRescheduleData.controls;
  // }

  // getAppointmentById() {
  //   let payload = {
  //     id: this.appointmentId,
  //     userId: this.currUserId,
  //   }
  //   this.appointmentService.getAppointmentById(payload)
  //     .subscribe(resp => {
  //       this.appointmentData = resp.data;
  //     },
  //       error => {
  //         this.error = error;
  //       });
  // }

  // /**
  //  * Reschedule-confirm
  //  */
  // confirmReschedule() {
  //   if (!this.formRescheduleData.valid) {
  //     return;
  //   }
  //   Swal.fire({
  //     title: 'Are you sure?',
  //     text: 'You want to reschedule appointment!',
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#34c38f',
  //     cancelButtonColor: '#f46a6a',
  //     confirmButtonText: 'Yes, Reschedule it!',
  //   }).then((result) => {
  //     if (result.value) {
  //       this.rescheduleEventData();
  //     }
  //   });
  // }

  // /**
  // * Reschedule event
  // */

  // rescheduleEventData() {
  //   if (!this.formRescheduleData.valid) {
  //     return;
  //   }
  //   const { startDate, endDate, rescheduleReason, slotStatus } = this.formRescheduleData.value;
  //   let payload = {
  //     appointmentId: this.appointmentId,
  //     userId: this.currUserId,
  //     currentSlotId: this.appointmentData.slotId,
  //     newSlotId: this.editEvent._def.publicId,
  //     appointmentStart: new Date(startDate),
  //     appointmentEnd: new Date(endDate),
  //     rescheduleReason: rescheduleReason,
  //     slotStatus: slotStatus,
  //   }
  //   this.appointmentService.rescheduleAppointment(payload)
  //     .subscribe(resp => {
  //       this.success = resp.message;
  //       this.submitted = false;
  //       this.modalService.dismissAll();
  //       Swal.fire('Rescheduled!', 'Appointment has been rescheduled.', 'success');
  //       this.router.navigate(['/ca/my-appointments']);
  //     },
  //       error => {
  //         this.error = error;
  //       });
  // }

  /**
   * Delete-confirm
   */
  confirm() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be delete avaliablity!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#34c38f',
      cancelButtonColor: '#f46a6a',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.value) {
        this.deleteEventData();
        Swal.fire('Deleted!', 'Avaliablity has been deleted.', 'success');
      }
    });
  }

  position() {
    Swal.fire({
      position: 'center',
      icon: 'success',
      title: 'Avaliablity has been saved',
      showConfirmButton: false,
      timer: 1000,
    });
  }

  /**
   * Event add modal
   */
  openModal(startTime, endTime) {
    //console.log(startTime)
    startTime = this.datepipe.transform(startTime, 'MM/dd/yyyy  h:mm a')
    endTime = this.datepipe.transform(endTime, 'MM/dd/yyyy  h:mm a')

    this.formData.get("startDate").setValue(startTime);
    this.formData.get("endDate").setValue(endTime);
    this.modalService.open(this.modalShow);
  }

  /**
   * save edit event data
   */
  editEventSave() {

    let startDate = this.formEditData.get('startDateEdit').value;
    let endDate = this.formEditData.get('endDateEdit').value;

    const editId = this.calendarEvents.findIndex(
      (x) => x.id + '' === this.editEvent.id + ''
    );

    this.editEvent.setProp('startDateEdit', startDate);
    this.editEvent.setProp('endDateEdit', endDate);

    this.calendarEvents[editId] = {
      ...this.editEvent,
      startDate: startDate,
      id: this.editEvent.id,
      const: endDate,
    };
    this.position();
    this.formEditData = this.formBuilder.group({
      startDateEdit: '',
      endDateEdit: '',
    });
    this.modalService.dismissAll();
  }

  /**
   * Delete event
   */
  deleteEventData() {
    this.SlotsService.DeleteSlotById(this.editEvent._def.publicId)
      .subscribe(resp => {
        this.modalService.dismissAll();
      });

    this.editEvent.remove();

  }

  /**
   * Close event modal
   */
  closeEventModal() {
    this.formData = this.formBuilder.group({
      startDate: '',
      endDate: '',
    });
    this.modalService.dismissAll();
  }

  /**
   * Save the slot
   */
  saveEvent() {
    if (!this.formData.valid) {
      return;
    }
    const { startDate, endDate } = this.formData.value;

    const slots = eachMinuteOfInterval({
      start: new Date(startDate),
      end: new Date(endDate)
    }, { step: this.slot })
    this.timeSlots = [];

    // slots.forEach(date => {
    //   this.timeSlots.push({ startDateTime: date, endDateTime: addMinutes(date, this.slot) })
    // });

    for (let i = 0; i < slots.length - 1; i++) {
      this.timeSlots.push({ startDateTime:moment(slots[i]).format('D MMMM  YYYY, h:mm a').toString(), endDateTime:moment(slots[i + 1]).format('D MMMM  YYYY, h:mm a').toString()})
    }
    let payload = {
      consultantId: this.currUserId,
      slotsList: this.timeSlots,
      id: 1
    }
   
    this.SlotsService.AddSlots(payload)
      .subscribe(resp => {
        this.success = resp.message;
        this.submitted = false;
        this.GetSlotsListByUserId();
        this.formData.reset();
      },
        error => {
          this.error = error;
        });
    this.modalService.dismissAll();
    this.submitted = true;
  }

  /**
   * Fetches the data
   */
  GetConsultantSettinglist() {
    this.mastersService.GetConsultantSettinglist()
      .subscribe(resp => {
        this.consultantSetting = resp.data;
        this.slot = this.consultantSetting[0].defaultSlotDuration;
      },
        error => {
        });
  }

  GetSlotsListByUserId() {
    let myPage = this;
    this.SlotsService.GetSlotsListByUserId(this.currUserId)
      .subscribe(resp => {
        this.currentEvents = resp.data;
        const timeArr = [];
        for (let i = 0; i < this.currentEvents.length; i++) {
          //let clr = "green";
          let clsName = 'bg-success text-white';
          let slotTitle = 'Available';

          if (new Date(this.currentEvents[i].startDateTime) < new Date() && this.currentEvents[i].isBooked) {
            //clr = "#aaa"; //passed and booked
            clsName = 'passed passed-dot';
            slotTitle = 'Passed';
          }
          else if (this.currentEvents[i].appointmentStatus == "") {
            //clr = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? "passed" : "available"; //booked
            clsName = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? 'passed passed-dot' : 'available available-dot';
            slotTitle = this.currentEvents[i].appointmentStatus == "" ? 'Avaliable' : this.currentEvents[i].appointmentStatus;
          }
          else if (this.currentEvents[i].appointmentStatus == "Awaiting") {
            //clr = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? "passed" : "approval"; //booked
            clsName = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? 'passed text-white passed-dot' : 'approval text-white approval-dot';
            slotTitle = "Pending for approval";
          }
          else if (this.currentEvents[i].appointmentStatus == "Confirmed" || this.currentEvents[i].appointmentStatus == "Reschedule") {
            //clr = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? "passed" : "confirmed"; //booked
            clsName = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? 'passed text-white passed-dot' : 'confirmed text-white confirmed-dot';
            slotTitle = this.currentEvents[i].appointmentStatus == "Confirmed" ? "confirmed" : "Rescheduled"; //this.currentEvents[i].appointmentStatus == "" ? 'Avaliable' : this.currentEvents[i].appointmentStatus;
          }
          else if (this.currentEvents[i].appointmentStatus == "Rejected" || this.currentEvents[i].appointmentStatus == "Canceled") {
            //clr = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? "passed" : "cancelled"; //booked
            clsName = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? 'passed text-white passed-dot' : 'cancelled text-white cancelled-dot';
            slotTitle = this.currentEvents[i].appointmentStatus == "Rejected" ? "Rejected" : "Canceled"; //this.currentEvents[i].appointmentStatus == "" ? 'Avaliable' : this.currentEvents[i].appointmentStatus;
          }
          // else { //if (new Date(this.currentEvents[i].startDateTime) > new Date() && this.currentEvents[i].isBooked) {
          //   clr = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? "#B8860B" : "#0080007a"; //booked
          //   clsName = (new Date(this.currentEvents[i].startDateTime) < new Date()) ? 'bg-calendar-orange ' : 'bg-calendar-success';
          //   slotTitle = this.currentEvents[i].appointmentStatus == "" ? 'Avaliable' : this.currentEvents[i].appointmentStatus;
          // }

          timeArr.push(
            {

              id: this.currentEvents[i].id,
              //color: clr,
              // color = (APP.AppointmentStart < DateTime.UtcNow) ? "#B8860B" : (APP.AppointmentStatus == "Available") ? "Green" : (APP.AppointmentStatus == "Reject") ? "red" : (APP.AppointmentStatus == "Pending") ? "Gray" : "Gray",
              // cursor = (APP.AppointmentStatus == "Past") ? "default" : (APP.AppointmentStatus == "Available") ? "pointer" : (APP.AppointmentStatus == "Reject") ? "default" : (APP.AppointmentStatus == "Pending") ? "default" : "default",
              title: slotTitle,
              start: this.currentEvents[i].startDateTime,
              end: this.currentEvents[i].endDateTime,
              className: clsName,
              // description: this.currentEvents[i].consulteeName + ' / ' + this.currentEvents[i].patientName + ' / ' +
              //   this.datepipe.transform(this.currentEvents[i].startDateTime, 'MM/dd/yyyy  h:mm a') + ' - ' +
              //   this.datepipe.transform(this.currentEvents[i].endDateTime, 'MM/dd/yyyy  h:mm a'),
              extendedProps: {
                appointmentId: this.currentEvents[i].appointmentId
              },
            });

          // console.log('desc: ', this.currentEvents[i].consulteeName + ' / ' + this.currentEvents[i].patientName + ' / ' +
          // this.datepipe.transform(this.currentEvents[i].startDateTime, 'MM/dd/yyyy  h:mm a') + ' - ' +
          // this.datepipe.transform(this.currentEvents[i].endDateTime, 'MM/dd/yyyy  h:mm a'));


          // timeArr.push(
          //   {
          //     id: this.currentEvents[i].id,
          //     color: (new Date(this.currentEvents[i].startDateTime) < new Date()) ? "#B8860B" : "#0080007a",
          //     // color = (APP.AppointmentStart < DateTime.UtcNow) ? "#B8860B" : (APP.AppointmentStatus == "Available") ? "Green" : (APP.AppointmentStatus == "Reject") ? "red" : (APP.AppointmentStatus == "Pending") ? "Gray" : "Gray",
          //     // cursor = (APP.AppointmentStatus == "Past") ? "default" : (APP.AppointmentStatus == "Available") ? "pointer" : (APP.AppointmentStatus == "Reject") ? "default" : (APP.AppointmentStatus == "Pending") ? "default" : "default",
          //     title: this.currentEvents[i].appointmentStatus == "" ? 'Avaliable' : this.currentEvents[i].appointmentStatus,
          //     start: this.currentEvents[i].startDateTime,
          //     end: this.currentEvents[i].endDateTime,
          //     className: (new Date(this.currentEvents[i].startDateTime) < new Date()) ? 'bg-calendar-orange ' : 'bg-calendar-success',
          //   });
        }

        this.calendarEvents1 = timeArr;
        //console.log(this.calendarEvents1)

        this.calendarOptions = {
          plugins: [timeGridPlugin, listPlugin, interactionPlugin],
          //timeZone: 'local',
          // height: 'auto',
          headerToolbar: {
            left: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,listMonth,listYear',
            center: 'title',
            right: 'prevYear,prev,next,nextYear'
          },

          navLinks: true, // can click day/week names to navigate views
          slotLabelInterval: '01:00:00',
          expandRows: true,
          selectable: true,
          selectMirror: true,
          initialView: "dayGridMonth",
          views: {
            dayGridMonth: { // name of view
              titleFormat: {
                year: 'numeric', month: '2-digit', day: '2-digit', meridiem: 'short', omitZeroMinute: true,
              }
              // other view-specific options here
            },
            listMonth: { buttonText: 'list month' },
            listYear: { buttonText: 'list year' },
            listWeek: { buttonText: 'list week' }
          },
          select: function (event) {
            myPage.SlotsService.ConvertDatetimeIntoUtc(moment(event.startStr).format('D MMMM  YYYY, h:mm a').toString())
            .subscribe(resp => {
              //alert(resp.result)
               ;

              console.log('respddd',resp.data.result)
              let currentDateTime = new Date(resp.data.result.currentDateTime);
             // currentDateTime = new Date(currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000));
             // let currDateTime=myPage.ConvertDateUsingTimeZone(currentDateTime, 'MM/dd/yyyy  h:mm a');
  //let startdatetime=new Date(resp.data.result.startDateTime);
             //let startStr  = new Date(event.startStr);
              // startStr = new Date(startStr.getTime() + (startStr.getTimezoneOffset() * 60000));
              if (currentDateTime < new Date(event.startStr)) {
                myPage.openModal(event.startStr, event.endStr);
              }
              else {
                //myPage.openModal(event.startStr, event.endStr);
                Swal.fire(myPage.datepipe.transform(event.startStr, 'MM/dd/yyyy  h:mm a'), 'The time or date has already passed.');
              }
            });
           
          },
          slotDuration: '00:' + myPage.slot + ':00',
          aspectRatio: 2,
          themeSystem: "bootstrap",
          //initialEvents: myPage.calendarEvents1,
          //eventRender: ,
          events: this.calendarEvents1,
          weekends: true,
          editable: false,
          dayMaxEvents: true,
          height: 1000,

          eventClick: this.handleEventClick.bind(this),
          // eventsSet: this.handleEvents.bind(this),
          // eventAfterRender: function (event, element) {
          //   $(element).tooltip({
          //     title: event.title,
          //     container: "body"
          //   });
          // }

          // eventRender: function (info) {
          //   var tooltip = new Tooltip(info.el, {
          //     title: info.event.extendedProps.description,
          //     placement: 'top',
          //     trigger: 'hover',
          //     container: 'body'
          //   });
          // }

          // eventRender: function (info) {
          //   console.log(info.event.extendedProps);
          // }

          // eventRender: function(eventObj, $el) {
          //   $el.popover({
          //     title: eventObj.title,
          //     content: eventObj.description,
          //     trigger: 'hover',
          //     placement: 'top',
          //     container: 'body'
          //   });
          // }

        };
      },
        error => {
        });
  }

  saveTiming() {
    let formData = this.formTimingData.value;

    let fromDate = formData.fromDate;
    let fromhours = formData.fromTime;
    let fromminute = formData.fromMinute;

    let toDate = formData.toDate;
    let tohours = formData.toTime;
    let tominute = formData.toMinute;
    //console.log('fromhours + this.fromam < tohours + this.toam', fromhours + this.fromam < tohours + this.toam);

    if (fromDate != "" && toDate != "") {

      if (new Date(toDate) < new Date(fromDate))
        Swal.fire('select valid date, todate should be greater than from date.');
      else

        if (fromhours < 1) {
          Swal.fire("Select Hours From.");
          return;
        }
      if (tohours < 1) {
        Swal.fire("Select Hours To.");
        return;
      }
      if (fromminute == "0") {
        Swal.fire("Select Minute From.");
        return;
      }
      if (tominute == "0") {
        Swal.fire("Select Minute To.");
        return;
      }

      if (this.fromam == 0 && fromhours == 12)
        fromhours = parseInt('00');

      let isvalid = true;
      if (fromhours == this.fromam)
        fromhours = 0

      if ((fromhours + this.fromam < tohours + this.toam) == false)
        isvalid = false;

      if (isvalid == false && ((fromminute < tominute) || (this.toam != this.fromam)))
        isvalid = true;

      if (fromDate == "" || fromDate == "") {
        Swal.fire("Please select From Date and To Date.");
        return;
      }
      else {
        if (isvalid == true) {
          if (this.fromAMPMText == undefined) {
            this.fromAMPMText = 'AM';
          }
          else {
            this.fromAMPMText = this.fromAMPMText.name;
          }

          if (this.toAMPMText == undefined) {
            this.toAMPMText = 'AM';
          }
          else {
            this.toAMPMText = this.toAMPMText.name;
          }

          let fromDatetime = (fromDate + ' ' + Number(fromhours) + ':' + fromminute + ":00 " + this.fromAMPMText);
          let toDateTime = (toDate + ' ' + Number(tohours) + ':' + tominute + ":00 " + this.toAMPMText);

          if (tohours == 12 && 0 == this.toam)
            toDateTime = (fromDate + '23:59:59');

          const days = eachDayOfInterval({
            start: new Date(fromDatetime),
            end: new Date(toDateTime)
          });

          days.forEach(element => {
            let date = (this.datepipe.transform(element, 'MM/dd/yyyy'));
            //console.log('heee',this.fromAMPMText.name)
            fromDatetime = (date + ' ' + Number(fromhours) + ':' + fromminute + ":00 " + this.fromAMPMText);
            toDateTime = (date + ' ' + Number(tohours) + ':' + tominute + ":00 " + this.toAMPMText);

            const slots = eachMinuteOfInterval({
              start: new Date(fromDatetime),
              end: new Date(toDateTime)
            }, { step: this.slot })
            this.timeSlots = [];
            //console.log("slots", this.slot)

            // slots.forEach(date => {
            //   this.timeSlots.push({ startDateTime: date, endDateTime: addMinutes(date, this.slot) })
            // });

            for (let i = 0; i < slots.length - 1; i++) {
              this.timeSlots.push({ startDateTime: slots[i], endDateTime: slots[i + 1] })
            }
            let payload = {
              consultantId: this.currUserId,
              slotsList: this.timeSlots,
              id: 1
            }
            this.SlotsService.AddSlots(payload)
              .subscribe(resp => {
                this.success = resp.message;
                this.submitted = false;
                this.GetSlotsListByUserId();
                this.formData.reset();
                Swal.fire("slot created successfully ", "Between " + (fromDate + ' ' + Number(fromhours) + ':' + fromminute + ":00 " + this.fromAMPMText) + ' To ' + (toDate + ' ' + Number(tohours) + ':' + tominute + ":00 " + this.toAMPMText), 'success');
              },
                error => {
                  this.error = error;
                });
          });
        }
        else {
          Swal.fire("Select correct time.");
        }
      }
    }
    else {
      if (fromDate == "" || fromDate == null) {
        if (toDate == "" || toDate == null) {
          Swal.fire("Please select  From Date and To Date.");
        }
        else {
          Swal.fire("Please select valid From Date.");
        }
      }
      else {
        if (toDate == "" || toDate == null) {
          Swal.fire("Please select To Date.");
        }
      }
    }
  }
  ConvertDateUsingTimeZone(date: any, format?: any) {
    let dateObj: Date = typeof date == 'string' ? new Date(date) : date;
    let offset = 7 * 60 * 60 * 1000;
    dateObj.setTime(dateObj.getTime() - offset);
    return this.datepipe.transform(dateObj, format, null, null) + ' PST';

  }
}
