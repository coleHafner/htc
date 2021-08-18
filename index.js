const app = new Vue({
  el: '#app',
  data: {
    paceType: 'AFT',

    startLeg: '',
    startLegs: [],

    finishTime: 27,
    finishTimes: [],

    startTime: 14.5,
    startTimes: [],

    runners: [
      [1, '', 'Tim'], [2, '8:00', 'Amanda'], [3, '', 'Jonathan'], [4, '', 'Elizabeth'],
      [5, '7:52', 'Cole'], [6, '7:15', 'Michael'], [7, '', 'Ivy'], [8, '9:00', 'Chris'],
      [9, '6:55', 'Dave'], [10, '', 'Emma'], [11, '', 'Rachel'], [12, '8:00', 'Sean']
    ],
    static: {
      hoursInDay: 24,
      milesOnCourse: 200,
      totalLegs: 36,
      legs: [
        [1, 5.44, 'VH'], [2, 5.64, 'H'], [3, 4.66, 'E'], [4, 7.18, 'M'], [5, 6.05, 'VH'], [6, 7.10, 'H'],
        [7, 5.25, 'M'], [8, 6, 'E'], [9, 5.38, 'M'], [10, 5.54, 'M'], [11, 5, 'E'], [12, 6.26, 'M'],
        [13, 5.21, 'E'], [14, 6.04, 'M'], [15, 7.25, 'H'], [16, 3.92, 'E'], [17, 5.32, 'M'], [18, 4.13, 'H'],
        [19, 5.89, 'VH'], [20, 5.75, 'VH'], [21, 5.06, 'M'], [22, 6.70, 'H'], [23, 4.23, 'E'], [24, 4.87, 'E'],
        [25, 3.8, 'E'], [26, 5.65, 'H'], [27, 6.36, 'M'], [28, 3.83, 'E'], [29, 5.97, 'VH'], [30, 5.32, 'M'],
        [31, 3.96, 'M'], [32, 4.2, 'M'], [33, 7.72, 'H'], [34, 4.12, 'E'], [35, 7.07, 'H'], [36, 5.03, 'M'],
      ],
      difficulty: {
        'E': { factor: .91, name: 'Easy' },
        'M': { factor: 1, name: 'Moderate' },
        'H': { factor: 1.09, name: 'Hard' },
        'VH': { factor: 1.17, name: 'Very Hard' },
      },
    },
  },
  created: function () {
    // finish times
    this.finishTimes.push({value: '', text: 'Est. Finish Time'});
    for (let i = 15; i <= 44; i++) {
      const avgPaceAsDecimal = (i * 60) / this.static.milesOnCourse;
      const pace = this.makePrettyPace(avgPaceAsDecimal, false, false);
      this.finishTimes.push({
        value: i,
        text: `${i} (${pace}/mi pace)`,
      });
    }

    // legs
    this.startLegs.push({value: '', text: 'Start Leg'});
    this.startLegs.push({value: 'all', text: 'All'});
    for (let i = 1; i <= 12; i++) {
      this.startLegs.push({
        value: i,
        text: i,
      })
    }

    // start times
    this.startTimes.push({value: '', text: 'Team Start Time'});
    for (let i = 2; i <= 17; i += .25) {
      this.startTimes.push({
        value: i,
        text: this.makePrettyTime(i).prettyTime,
      })
    }
  },
  computed: {
    times: function() {
      if (!this.startLeg || !this.startTime || !this.finishTime) {
        return [];
      }

      let selectedLegs = this.startLeg === 'all'
        ? Array(this.static.totalLegs).fill().map((val, index) => index + 1)
        : [this.startLeg, this.startLeg + 12, this.startLeg + 24];

      const times = selectedLegs.map(i => 
        this.getStartTime(
          i,
          this.startTime,
          this.finishTime,
          this.paceType
        )
      );

      return times;
    }
  },
  methods: {
    makePrettyPace: function (minsAsDecimal, showHours = true, zeroPrefixMins = true) {
      const hours = minsAsDecimal / 60;
      const fullHrs = Math.floor(hours);

      const mins = fullHrs > 0 ? hours % fullHrs * 60 : minsAsDecimal;
      const fullMins = Math.floor(mins);

      const secs = Math.floor(mins % fullMins * 60);

      const hrsSegment = showHours && fullHrs > 0 ? `${fullHrs === 0 ? '00' : fullHrs}:` : '';
      return `${hrsSegment}${fullMins < 10 && zeroPrefixMins ? `0${fullMins}` : fullMins}:${secs < 10 ? `0${secs}` : secs}`;
    },
    makePrettyTime: function (startTime) {
      const hours = Math.floor(startTime);
      const mins = hours > 0 ? Math.floor(startTime % hours * 60) : 0;
      const meridiem = hours > 12 ? 'PM' : 'AM';
      const prettyTime = `${hours > 12 ? hours - 12 : hours === 0 ? '12' : hours}:${mins < 10 ? `0${mins}` : mins} ${meridiem}`;

      return {hours, prettyTime};
    },
    getStartTime: function (legNum, paceType) {
      const avgMileTime = (this.finishTime * 60) / this.static.milesOnCourse;
      let timeFromStart = 0;

      const difficultyMap = this.static.difficulty;

      const calcDuration = (leg, avgMileTime) => {
        const [_, distance, difficulty] = leg;
        return (avgMileTime * distance) * difficultyMap[difficulty].factor;
      }

      const getAvgMileTimeForLeg = (leg, defaultAvgMileTime) => {
        const [legNum] = leg;
        let avgToUse = defaultAvgMileTime;

        if (paceType === 'PerRunner') {
          let runnerKey = legNum;

          if (legNum > 24) {
            runnerKey = legNum - 24;
          } else if (legNum > 12) {
            runnerKey = legNum - 12;
          }

          const [_, pace, name] = runners[runnerKey - 1];

          if (pace) {
            const [mins, secs] = pace.split(':');
            avgToUse = parseInt(mins) + (secs === '00' ? 0 : parseInt(secs) / 60);
          }
        }

        return avgToUse;
      };

      for (let i = 1; i < legNum; i++) {
        const leg = this.static.legs[i - 1];
        const avgToUse = getAvgMileTimeForLeg(leg, avgMileTime);
        const estTime = calcDuration(leg, avgToUse);
        timeFromStart += estTime;
      }

      const totalTime = (timeFromStart / 60) + this.startTime;

      let day = 'Friday';
      let finalStartTime = totalTime;

      if (totalTime >= this.static.hoursInDay) {
        day = 'Saturday';
        finalStartTime = totalTime - this.static.hoursInDay;
      }

      if (totalTime >= (this.static.hoursInDay * 2)) {
        day = 'Sunday';
        finalStartTime = totalTime - (this.static.hoursInDay * 2);
      }

      const { prettyTime, hours } = this.makePrettyTime(finalStartTime);

      const flags = {
        nightRun: false,
      };

      if (hours >= 19 || hours < 5) {
        flags.nightRun = true;
      }

      const leg = this.static.legs[legNum - 1];
      const [_, distance, difficulty] = leg;
      const avgToUse = getAvgMileTimeForLeg(leg, avgMileTime)
      const duration = calcDuration(leg, avgToUse);
      const prettyDuration = this.makePrettyPace(duration);

      return {
        day,
        distance,
        difficulty: difficultyMap[difficulty].name,
        duration: prettyDuration,
        durationMinutes: duration,
        startTime: prettyTime,
        startTimeHours: finalStartTime,
        legNum,
        flags,
      }
    },
  },
});