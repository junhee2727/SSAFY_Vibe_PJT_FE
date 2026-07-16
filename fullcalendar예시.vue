<script>
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'; // 시간 그리드 플러그인 추가
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import MyPageSideBar from "@/components/sidebar/MyPageSideBar.vue";
export default {
  components: {
    FullCalendar,
    MyPageSideBar
  },
  data() {
    return {
      calendarOptions: {
        plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay' // 월별, 주별, 일별 보기 버튼 추가
      },
      views: {
        dayGridMonth: { // 월별 뷰 설정
          buttonText: '월별'
        },
        timeGridWeek: { // 주별 뷰 설정
          buttonText: '주별'
        },
        timeGridDay: { // 일별 뷰 설정
          buttonText: '일별'
        }
      },
        events: [],
        editable: true,
        dateClick: this.handleDateClick,
        eventClick: this.handleEventClick,
        displayEventTime: true,
        eventDrop: this.handleEventDrop, // 이벤트 드래그
        navLinks: true,
        dayCellClassNames: (arg) => {
          const day = arg.date.getDay();
          if (day === 0) {
          return 'fc-sunday';
          } else if (day === 6) {
          return 'fc-saturday';
          } else {
          return 'fc-weekday';
          }
      },
      dayHeaderClassNames: (arg) => {
          const day = arg.date.getDay();
          if (day === 0) {
          return 'fc-sunday-header';
          } else if (day === 6) {
          return 'fc-saturday-header';
          } else {
          return 'fc-weekday-header';
          }
      },
      datesSet: this.handleDatesSet,
      locale: 'ko', // 한국어 로케일 설정
      },
      isModalOpen: false,
      isEditing: false,
      eventTypes: [
          { name: '진행 중', type: 'IN_PROGRESS' },
          { name: '완료됨', type: 'COMPLETED' }
      ],
      formData: {
        id: null,
        title: '',
        content: '',
        startDate: new Date(),
        endDate: new Date(),
        startDateText: '',
        endDateText: '',
        type: '',
      },
      holidays: [], // 공휴일 초기화
      menuStart: false,
      menuEnd: false,
      childList: [],
      reservationList: [],
      userEvents: [],
      selectedReservation: null,
      selectedEvent: null,
      isReservationEvent: false,
      selectedChildName: '',
      selectedChildId: null,
      selectedChild: null,
      colorPalette: ['#FF9800', '#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#3F51B5', '#8BC34A', '#FF5722'],
      colorIndex: 0,
      memberColors: {},
    };
  },
methods: {
  translateType(englishItem) {
    const itemMap = {
      'IN_PROGRESS': '진행 중',
      'COMPLETED': '완료',
    };
    return itemMap[englishItem] || englishItem;  // 매핑되지 않은 값은 그대로 출력
  },
  handleDatesSet(info) {
  const startDate = info.start.toISOString(); // 시작일 ISO 포맷
  const endDate = info.end.toISOString();     // 종료일 ISO 포맷

  this.fetchHolidays(startDate, endDate);
  if (this.selectedChild) {
      this.fetchReservationList(this.selectedChild, startDate, endDate);
  }
  },


  fetchHolidays(startDate, endDate) {
      axios
          .get(`${process.env.VUE_APP_API_BASE_URL}/member-service/api/google-calendar-holidays`, {
          params: {
              start: startDate,
              end: endDate,
          },
          })
      .then((response) => {
          // 공휴일 데이터를 저장
          this.holidays = response.data.items.map(korea => ({
              title: korea.summary,
              start: korea.start.date || korea.start.dateTime,
              end: korea.end.date || korea.end.dateTime,
              allDay: true,
              backgroundColor: 'red',
              editable: false,
              extendedProps: {
                  isHoliday: true,
              }
          }));

          // 공휴일을 가져온 후 이벤트 결합
          this.combineEvents();
      })
      .catch((error) => {
          console.error('Error fetching holidays:', error);
      });
  },



  fetchChildList() {
  axios
      .get(`${process.env.VUE_APP_API_BASE_URL}/member-service/child/`)
      .then((response) => {
          this.childList = response.data.result;
      })
      .catch((error) => {
          console.error('Error fetching child list:', error);
      });
  },
      
  fetchReservationList(child) {
      console.log(child)
      this.selectedChildName = child.name;
      this.colorIndex = 0;
      this.memberColors = {};

      axios
          .get(`${process.env.VUE_APP_API_BASE_URL}/reservation-service/reservation/list/child/${child.id}`)
          .then((response) => {
              const reservationEvents = response.data.map((reservation) => {
                  let memberName = reservation.memberName;

                  if (!this.memberColors[memberName]) {
                      this.memberColors[memberName] = this.colorPalette[this.colorIndex];
                      this.colorIndex = (this.colorIndex + 1) % this.colorPalette.length;
                  }

                  return {
                      title: `${reservation.hospitalName} - ${reservation.medicalItem}`,
                      start: new Date(`${reservation.reservationDate}T${reservation.reservationTime}`),
                      end: new Date(`${reservation.reservationDate}T${reservation.reservationTime}`),
                      backgroundColor: this.memberColors[memberName],
                      allDay: false,
                      editable: false,
                      extendedProps: {
                          ...reservation,
                          isReservationEvent: true,
                      },
                  };
              });
              this.reservationList = reservationEvents;

              // 예약 리스트를 가져온 후 이벤트 결합
              this.combineEvents(); 
          })
          .catch((error) => {
              console.error('Error fetching reservation list:', error);
          });
  },
    fetchUserEvents() {
      axios
        .get(`${process.env.VUE_APP_API_BASE_URL}/member-service/event/list`)
        .then((response) => {
          const userEvents = response.data.content.map((event) => ({
            id: event.id,
            title: event.title,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            backgroundColor: event.type === 'COMPLETED' ? '#D3D3D3' : '#0075FF',
            border: 'none',
            extendedProps: {
              content: event.content,
              type: event.type,
              isReservationEvent: false,
            },
          }));
          this.userEvents = userEvents;
          this.combineEvents();
        })
        .catch((error) => {
          console.error('Error fetching user events:', error);
        });
    },


  combineEvents() {
  // 공휴일, 사용자 이벤트, 예약 리스트를 모두 결합
  this.calendarOptions.events = [...this.holidays, ...this.userEvents, ...this.reservationList];
  
  this.$nextTick(() => {
      if (this.$refs.fullCalendar) {
          this.$refs.fullCalendar.getApi().refetchEvents();
      }
  });
  },


  handleChildClick(child) {
  // 자녀 선택 후 selectedChild에 저장
      this.selectedChild = child;
      this.selectedChildId = child.id; // 클릭한 자녀의 ID 저장
      this.fetchReservationList(child);
  },


    handleEventClick(info) {
      const isReservationEvent = info.event.extendedProps.isReservationEvent;
      const isHoliday = info.event.extendedProps.isHoliday;

      // 공휴일일 경우 아무 동작도 하지 않음
      if (isHoliday) {
      return;  // 클릭 이벤트를 무시
      }

      if (isReservationEvent) {
        this.selectedReservation = info.event.extendedProps;
        this.isReservationEvent = true;
      } else {
        this.isEditing = false; // 처음엔 수정모드가 아님
        this.selectedEvent = info.event.extendedProps;
        this.formData.id = info.event.id;
        this.formData.title = info.event.title;
        this.formData.content = info.event.extendedProps.content;
        this.formData.startDate = info.event.start;
        this.formData.endDate = info.event.end;
        this.formData.startDateText = this.formatDate(info.event.start);
        this.formData.endDateText = this.formatDate(info.event.end);
        this.formData.type = info.event.extendedProps.type || '';
        this.isReservationEvent = false;
      }
    },

    handleDateClick(info) {
      this.isEditing = false;
      this.formData.startDate = info.date;
      this.formData.endDate = info.date;
      this.formData.startDateText = this.formatDate(info.date);
      this.formData.endDateText = this.formatDate(info.date);
      this.selectedEvent = null;
      this.isReservationEvent = false;
    },

    formatDate(date) {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    },

    confirmStartDate() {
      this.updateStartDate(this.formData.startDate);
      this.menuStart = false;
    },

    confirmEndDate() {
      this.updateEndDate(this.formData.endDate);
      this.menuEnd = false;
    },

    updateStartDate(val) {
      this.formData.startDate = val;
      this.formData.startDateText = this.formatDate(val);
    },

    updateEndDate(val) {
      this.formData.endDate = val;
      this.formData.endDateText = this.formatDate(val);
    },

    handleSaveEvent() {
      const url = this.isEditing && this.formData.id 
        ? `${process.env.VUE_APP_API_BASE_URL}/member-service/event/update/${this.formData.id}`
        : `${process.env.VUE_APP_API_BASE_URL}/member-service/event/create`;

      const payload = {
        title: this.formData.title,
        content: this.formData.content,
        startTime: `${this.formData.startDateText}T00:00:00`,
        endTime: `${this.formData.endDateText}T23:59:59`,
        type: this.formData.type,
      };

      axios({
        method: 'post',
        url: url,
        data: payload,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(() => {
          this.fetchUserEvents(); // 이벤트 저장 후 사용자 이벤트 새로고침
          this.isEditing = false; // 수정 모드를 해제하고 다시 디테일을 보여줌
        })
        .catch((error) => {
          console.error('Error saving event:', error);
        });
    },

    deleteEvent() {
      const id = this.formData.id;

      axios
        .get(`${process.env.VUE_APP_API_BASE_URL}/member-service/event/delete/${id}`)
        .then(() => {
          this.fetchUserEvents(); // 삭제 후 사용자 이벤트 새로고침
        })
        .catch((error) => {
          console.error('Error deleting event:', error);
        });
    },

    startNewEvent() {
      this.isEditing = true;
      this.formData = {
        id: null,
        title: '',
        content: '',
        startDate: new Date(),
        endDate: new Date(),
        startDateText: this.formatDate(new Date()),
        endDateText: this.formatDate(new Date()),
        type: '',
      };
      this.selectedEvent = null;
      this.isReservationEvent = false;
    },

  handleEventDrop(info) {
      const eventId = info.event.id;  // 이벤트 ID
      const newStartDate = info.event.startStr.split('+')[0];  // 새로운 시작 날짜에서 오프셋 제거
      const newEndDate = info.event.endStr ? info.event.endStr.split('+')[0] : newStartDate;  // 종료 날짜
  
  // 서버로 업데이트 요청
  axios({
    method: 'post',
    url: `${process.env.VUE_APP_API_BASE_URL}/member-service/event/update/${eventId}`,
    data: {
      startTime: newStartDate,  // 새로운 시작 날짜
      endTime: newEndDate,  // 새로운 종료 날짜
    },
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  })
  .then(() => {
    this.fetchUserEvents();  // 이벤트를 다시 불러옴
  })
  .catch((error) => {
    console.error('Error updating event:', error);
    // 이벤트 드래그가 실패하면 원래 위치로 되돌림
    info.revert();
  });
},
  },

  mounted() {
      this.fetchUserEvents(); 
      this.fetchChildList(); 
  },
};
</script>