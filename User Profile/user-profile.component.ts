import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DemoModalComponent } from "./../../shared/modals/demo-modal/demo-modal.component";
import { Router, ActivatedRoute } from "@angular/router";
import { UserProfileService } from "../../_services/userProfile.service";
import { AuthService } from "../../_services/auth.service";
import { Component, OnInit } from "@angular/core";
import { SharedService } from "src/app/_services/shared.service";
import { saveAs } from "file-saver";
import * as moment from "moment";
import { SubscriptionService } from "src/app/_services/Subscription.service";
import { UploadUserDocumentModalComponent } from "src/app/shared/modals/upload-user-document-modal/upload-user-document-modal.component";
import Swal from "sweetalert2";
import { RatingCommentModalComponent } from "src/app/shared/modals/rating-Comment-modal/rating-Comment-modal.component";
import { ConsultationsService } from "src/app/_services/consultations.service";
import { DigitalSignatureModalComponent } from "src/app/shared/modals/digital-signature-modal/digital-signature-modal.component";

@Component({
  selector: "app-profile",
  templateUrl: "./user-profile.component.html",
  styleUrls: ["./user-profile.component.scss"],
})
export class UserProfileComponent implements OnInit {
  // bread crumb items
  breadCrumbItems: Array<{}>;
  userProfile: any;
  userType: string = "";
  profileImageUrl: any;
  groupProfileData: any;
  groupAssoProfileData: any;
  // boardCertification:any;
  userId: any;
  documentList: any;
  experience: any;
  subscriptionList: any;
  isFileSelected: boolean = false;
  error = "";
  success = "";
  isNotUS: boolean = false;
  countryList: any;
  reviewList: any;
  docCount: 0;
  autoRenew: boolean;
  isFellowshipShow: boolean = false;
  isDateRecertifiedShow: boolean = false;
  issecondarylanguage:  boolean = false;
  iswebSiteUrl:  boolean = false;

  constructor(
    private router: Router,
    private consultationsService: ConsultationsService,
    private subscriptionService: SubscriptionService,
    private sharedService: SharedService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private authService: AuthService,
    private userProfileServise: UserProfileService
  ) { }

  ngOnInit() {
    this.breadCrumbItems = [
      { label: "Dashboard" },
      { label: "My Profile", active: true },
    ];
    this.userType = this.authService.currentUserValue.role;
    this.userId = this.authService.currentUserValue.id;
    this.sharedService.getCountryList().subscribe((resp) => {
      this.countryList = resp.data;
    });
    if (this.userType == "SuperAdmin") {
      this.getProfile();
    } else if (
      this.userType == "ConsultantGroup" ||
      this.userType == "ConsulteeGroup" ||
      this.userType == "HybridGroup"
    ) {
      this.getGroupProfile();
      this.getSubscriptionList();
    } else {
      this.getDetailProfile();
      this.getAssoGroupProfile();
      this.getSubscriptionList();
    }
    this.getAllDocumentList();
  }

  getProfile() {
    this.userProfileServise.getProfile().subscribe(
      (resp) => {
        this.userProfile = resp.data;
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getDetailProfile() {
    this.userProfileServise.getProfile().subscribe(
      (resp) => {
        this.userProfile = resp.data;
        if (this.userProfile?.professionalInfo?.fellowship != "")
        this.isFellowshipShow = true;
      if (this.userProfile?.professionalInfo?.dateRecertified)
        this.isDateRecertifiedShow = true;
      if (this.userProfile?.professionalInfo?.secondaryLanguageName)
        this.issecondarylanguage = true;
      if (this.userProfile?.websiteUrl)
        this.iswebSiteUrl = true;

        if (this.countryList) {
          let country = this.countryList.filter(
            (e) => e.id == resp.data.countryId
          )[0].name;
          if (country == "United States") this.isNotUS = true;
          else this.isNotUS = false;
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getGroupProfile() {
    this.userProfileServise.getGroupProfile(this.userId).subscribe(
      (resp) => {
        this.groupProfileData = resp.data;
        if (this.groupProfileData?.websiteUrl)
        this.iswebSiteUrl = true;
      },
      (err) => {
        console.log(err);
      }
    );
  }
  getAssoGroupProfile() {
    this.userProfileServise.getAssoGroupProfile(this.userId).subscribe(
      (resp) => {
        this.groupAssoProfileData = resp.data;
      },
      (err) => {
        console.log(err);
      }
    );
  }
  selectProfileImage(event, status) {
    let fileToUpload = event.target.files[0];
    const userId = this.authService.currentUserValue.id.toString();

    let fileForm = new FormData();
    fileForm.append("file", fileToUpload);
    fileForm.append("id", userId);

    this.userProfileServise.updateProfileImage(fileForm).subscribe(
      (resp) => {
        if (status == 'user') {
          this.getProfile();
        }

        else if (status == 'group') {
          this.getGroupProfile();
        }

        this.onSuccessSave();
      },
      (err) => { }
    );
  }
  selectSignature(event) {
    let fileToUpload = event.target.files[0];
    const userId = this.authService.currentUserValue.id.toString();
    let fileForm = new FormData();
    fileForm.append("file", fileToUpload);
    fileForm.append("id", userId);
    this.userProfileServise.uploadSignature(fileForm).subscribe(
      (resp) => {
        this.getProfile();
        this.onSuccessSave();
      },
      (err) => { }
    );
  }

  onSuccessSave() {
    this.authService.refreshCurrentUser().subscribe((user) => { });
  }
  cancelPaypalSubscription(id) {
    this.subscriptionService.cancelSubscriptionPaypal(id).subscribe((resp) => {
      Swal.fire("", "Cancel Your Plan", "success")
    });
  }
  showDemoModal() {
    const modalRef = this.modalService.open(DemoModalComponent);
    modalRef.componentInstance.data =
      this.authService.currentUserValue.firstName;

    modalRef.closed.subscribe((result) => {
      alert(result.name);
    });
  }

  digitalSignatureModel() {
    const modalRef = this.modalService.open(DigitalSignatureModalComponent);
    modalRef.componentInstance.data =
      this.authService.currentUserValue.firstName;

    modalRef.closed.subscribe((result) => {
      var payload = {
        userId: this.userId,
        digitalImage: result.signature,
      };
      console.log('payload', payload)
      this.userProfileServise.uploadDigitalSignature(payload).subscribe(
        (resp) => {
          this.getProfile();
          Swal.fire("", "Signature Created Successfully", "success");
        },
        (err) => { }
      );
    });
  }

  editBasicProfile() {
    this.router.navigate([this.authService.toRoleRoute("/edit-basic-profile")]);
  }

  editGroupProfile() {
    this.router.navigate([this.authService.toRoleRoute("/edit-group-profile")]);
  }

  editProfessionalProfile() {
    this.router.navigate([
      this.authService.toRoleRoute("/edit-professional-profile"),
    ]);
  }

  changePassword() {
    this.router.navigate([this.authService.toRoleRoute("/change-password")]);
  }

  cancelPlan(id) {
    this.subscriptionService.cancelSubscription(id).subscribe((res) => {
      Swal.fire('', 'Your cancel subscription plan request send.', 'success');

    });
  }

  upgradePlan() {
    //this.router.navigate([this.authService.toRoleRoute("/change-password")]);
    // this.router.navigate(['/account/subscriptions/' + this.userType]);
    this.router.navigate([`/account/subscriptions/${this.userType}/1`]);

  }
  getAllDocumentList() {
    this.sharedService.getAllDocumentList(this.userId).subscribe((res) => {
      this.documentList = res;
      this.docCount = res.length;
      if (this.documentList.length > 0)
        this.isFileSelected = true;
      else
        this.isFileSelected = false;
    });
  }

  downloadDocument(Id, fileName, fileType) {
    this.sharedService.downloadDocument(Id).subscribe((res) => {
      //var ext = fileName.split('.').pop();
      const blob = new Blob([res], { type: "application/" + fileType });
      const file = new File([blob], fileName + fileType, {
        type: "application/" + fileType,
      });
      saveAs(file);
    });
  }
  getSubscriptionList() {
    this.userId = this.authService.currentUserValue.id;
    //console.log(' this.userId?', this.userId)
    this.subscriptionService
      .GetActiveSubscriptionByUserID(this.userId)
      .subscribe(({ data }) => {
        this.subscriptionList = data;
        console.log('this.subscriptionList', this.subscriptionList)
        console.log('this.userid', this.userId)

      });
  }
  addDocument() {
    const modalRef = this.modalService.open(UploadUserDocumentModalComponent, {
      size: "lg",
    });
    modalRef.componentInstance.data = { userId: this.userId };
    modalRef.closed.subscribe((result) => {
      //refresh List
      this.documentList.push(result);
      this.uploadDocument();
      if (this.documentList.length > 0) this.isFileSelected = true;
      else this.isFileSelected = false;
    });
  }
  uploadDocument() {
    const documentForm = new FormData();
    for (var i = 0; i < this.documentList.length; i++) {
      if (this.documentList[i].id)
        documentForm.append(
          "documents[" + i + "][id]",
          this.documentList[i].id
        );
      else documentForm.append("documents[" + i + "][id]", "0");

      documentForm.append("files[]", this.documentList[i].file);
      documentForm.append(
        "documents[" + i + "][documentName]",
        this.documentList[i].documentName
      );
      documentForm.append(
        "documents[" + i + "][documentType]",
        this.documentList[i].documentType
      );
    }
    documentForm.append("userId", this.userId);
    this.sharedService.uploadDocument(documentForm).subscribe(
      (event) => {
        console.log(event.data);
        this.getAllDocumentList();
      },
      (err) => (this.error = err)
    );
  }
  onDocumentRemove(document) {
    //remove from api, refresh list
    this.documentList = this.documentList.filter(
      (m) => m.documentName != document.documentName
    );
    if (this.documentList.length > 0) {
      this.isFileSelected = true;
    } else {
      this.isFileSelected = false;
    }
    this.sharedService.RemoveDocument(document.id).subscribe(
      (resp) => {
        Swal.fire(
          "Deleted!",
          "Document has been deleted successfully.",
          "success"
        );
        this.getAllDocumentList();
      },
      (err) => { }
    );
  }
  confirmDelete(document) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be delete document!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.value) {
        this.onDocumentRemove(document);
      }
    });
  }

  ratingReviewList(userId, rating) {
    if (rating > 0)
      this.consultationsService.GetConsultationReviewByUserId(userId).subscribe(
        ({ data }) => {
          this.reviewList = data;
          //ratingDescription
          const modalRef = this.modalService.open(RatingCommentModalComponent);
          modalRef.componentInstance.data = this.reviewList;
          modalRef.closed.subscribe((result) => {
            // console.log("result:",result);
          });
        },
        (err) => { }
      );
  }
  // downloadDocument(Id, fileName) {
  //   this.sharedService.downloadDocument(Id).subscribe(res => {
  //     var ext = fileName.split('.').pop();
  //     const blob = new Blob([res], { type: 'application/' + ext });
  //     const file = new File([blob], fileName, { type: 'application/' + ext });
  //     saveAs(file);
  //   });
  // }
}
