const colorClass = {
  0: '#FF0000',
  1: '#FF1100',
  2: '#FF2300',
  3: '#FF3400',
  4: '#FF4600',
  5: '#FF5700',
  6: '#FF6900',
  7: '#FF7B00',
  8: '#FF8C00',
  9: '#FF9E00',
  10: '#FFAF00',
  11: '#FFC100',
  12: '#FFD300',
  13: '#FFE400',
  14: '#FFF600',
  15: '#F7FF00',
  16: '#E5FF00',
  17: '#D4FF00',
  18: '#C2FF00',
  19: '#B0FF00',
  20: '#9FFF00',
  21: '#8DFF00',
  22: '#7CFF00',
  23: '#6AFF00',
  24: '#58FF00',
  25: '#47FF00',
  26: '#35FF00',
  27: '#24FF00',
  28: '#12FF00',
  29: '#00FF00',
};

function getProgressBar(percentage, color) {
  return `<div class="progress"><div class="progress-bar role="progressbar" style="width: ${percentage}%; background-color: ${color}" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div></div>`;
}

function projectDetailsChart(project, type, labels, values1, values2) {
  const color = type === 'progress' ? '#9c2ca3' : '#ffa500';
  const chartId = type === 'progress' ? 'projectDetailsProgressChart' : 'projectDetailsUsersChart';
  const yLabel1 = type === 'progress' ? 'Overall Progress (%)' : 'Total number of participants';
  const yLabel2 = type === 'progress' ? 'Increase in progress (%)' : 'Increase in number of participants';
  const title = type === 'progress' ? 'Progress for Project: ' : 'Number of participants for Project: ';
  const tooltipSuffix = type === 'progress' ? '%' : '';

  const myChart = new Chart($(`#${chartId}`), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: yLabel1,
        data: values1,
        fill: false,
        backgroundColor: color,
        borderColor: color,
        yAxisID: 'yAxis1',
      },
      {
        label: yLabel2,
        data: values2,
        fill: false,
        backgroundColor: '#ff6384',
        borderColor: '#ff6384',
        yAxisID: 'yAxis2',
      },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Date',
          },
        }],
        yAxes: [{
          id: 'yAxis1',
          position: 'left',
          scaleLabel: {
            display: true,
            labelString: yLabel1,
          },
        },
        {
          id: 'yAxis2',
          position: 'right',
          scaleLabel: {
            display: true,
            labelString: yLabel2,
          },
        }],
      },
      title: {
        display: true,
        text: title + project,
      },
      tooltips: {
        callbacks: {
          label(tooltipItem) {
            return `${project}: ${tooltipItem.yLabel}${tooltipSuffix}`;
          },
        },
      },
    },
  });

  return myChart;
}

function projectDetailsLink(project, sheetIndex) {
  return `<div><a href="./projectDetails?projectId=${sheetIndex}&project=${project}">${project}</a></div>`;
}

function datasourceLink(sheetIndex) {
  return `https://spreadsheets.google.com/feeds/list/16HhDEP6eG9sxX0yZd0NbLMgNAjafz_ms88lGUytV6EI/${sheetIndex}/public/full?alt=json`;
}

function projects() {
  $.getJSON(datasourceLink(1))
    .done((data) => {
      const dataRows = [];
      let progress = 0.0;
      let weeklyprogress = '';
      let colorClassIndex = '';
      $.each(data.feed.entry, (index, row) => {
        progress = row.gsx$progress.$t.replace('%', '');
        weeklyprogress = row.gsx$daytotalchange.$t;
        colorClassIndex = Math.max(0, Math.floor((30 * progress) / 100) - 1);
        dataRows[index] = {
          projectVal: row.gsx$project.$t,
          project: projectDetailsLink(row.gsx$project.$t, row.gsx$sheetindex.$t),
          progressVal: progress,
          progress: getProgressBar(progress, colorClass[colorClassIndex]),
          weeklyprogressVal: weeklyprogress.replace('%', ''),
          weeklyprogress,
          daysToCompletionVal: row.gsx$estimateddaystocompletion.$t,
          daysToCompletion: row.gsx$estimatedcompletion.$t,
          completionDate: row.gsx$estimatedcompletiondate.$t,
          lastUpdated: row.gsx$lastupdated.$t,
        };
      });
      $('#projectSummaryTable').bootstrapTable({
        data: dataRows,
        formatNoMatches() {
          return 'No data found.';
        },
      });
      $('#projectSummaryTable').show();

      const dates = data.feed.entry.map((e) => e.gsx$lastupdated.$t);
      $('#projectSummaryTitle').html(`Last updated on ${dates.sort().pop()}.`);
    })
    .fail(() => {
      // The project specified in the URL does not point to a valid project or there isn't data yet
      alert('Unable to get data.');
    })
    .always(() => {
      // alert('always');
    });
}

function projectDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has('project') || !urlParams.has('projectId')) {
    alert('Missing project.');
    return;
  }

  const project = urlParams.get('project');
  const projectId = urlParams.get('projectId');
  if (!Number.isInteger(parseInt(projectId, 10))) {
    alert('Unable to get data for project.');
    return;
  }

  $.getJSON(datasourceLink(projectId))
    .done((data) => {
      const labels = data.feed.entry.map((e) => e.gsx$date.$t);

      // Progress
      const progress = data.feed.entry.map((e) => e.gsx$completed.$t.replace('%', ''));

      // Change in Progress
      const changeInProgress = data.feed.entry.map((e) => e.gsx$changeincompletion.$t.replace('%', ''));

      // Users
      const users = data.feed.entry.map((e) => e.gsx$totalusers.$t);

      // Change in Users
      const changeInUsers = data.feed.entry.map((e) => e.gsx$changeinusers.$t);

      // Draw charts
      projectDetailsChart(project, 'progress', labels, progress, changeInProgress);
      projectDetailsChart(project, 'users', labels, users, changeInUsers);
      $('#projectDetailsTitle').html(`Progress and participation rates for project ${project}.`);
    })
    .fail(() => {
      // The project specified in the URL does not point to a valid project or there isn't data yet
      alert('Unable to get data for project.');
    })
    .always(() => {
      // alert('always');
    });
}

$(document).ready(() => {
  // All projects summary
  const page = window.location.pathname.split('/').pop();
  if (page === 'projects') {
    projects();
  }

  // Project Details
  if (page === 'projectDetails') {
    projectDetails();
  }

  // Toggle page description visibility
  $('#togglePageDescription').on('click', function togglePageDescription(e) {
    e.preventDefault();
    if ($('#pageDescription').is(':visible')) {
      $('#pageDescription').hide();
      $(this).text('Details');
    } else {
      $('#pageDescription').show();
      $(this).text('Hide details');
    }
  });
});
