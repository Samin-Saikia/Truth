 // State
 let tasks = [];
 let completedTasks = [];
 let projects = [];
 let events = [];
 let currentProject = null;
 let currentDate = new Date();
 let calendarDate = new Date();
 let theme = localStorage.getItem('theme') || 'dark';
 let timerInterval = null;
 let timeLeft = 25 * 60;
 let isRunning = false;
 let isBreak = false;
 let focusDuration = 25;
 let breakDuration = 5;
 let stats = {
     sessionsToday: 0,
     focusTimeToday: 0
 };
 let completionHistory = JSON.parse(localStorage.getItem('completionHistory') || '{}');

 // Quotes
 const quotes = [
     { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
     { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
     { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
     { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
     { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
     { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
     { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
     { text: "Your limitation—it's only your imagination.", author: "Unknown" },
     { text: "Great things never come from comfort zones.", author: "Unknown" },
     { text: "Dream it. Wish it. Do it.", author: "Unknown" }
 ];

 // Initialize
 document.addEventListener('DOMContentLoaded', () => {
     applyTheme();
     loadData();
     updateDate();
     showDailyQuote();
     updateAllStats();
     renderCalendar();
     updateCountdowns();
     updateMonthlyReport();
     setInterval(updateCountdowns, 60000);
 });

 // Theme
 function applyTheme() {
     document.documentElement.setAttribute('data-theme', theme);
     document.getElementById('themeToggle').innerHTML = theme === 'dark' ? '&#9790;' : '&#9788;';
 }

 function toggleTheme() {
     theme = theme === 'dark' ? 'light' : 'dark';
     localStorage.setItem('theme', theme);
     applyTheme();
 }

 // Tab switching
 document.querySelectorAll('.tab').forEach(tab => {
     tab.addEventListener('click', () => {
         const targetTab = tab.dataset.tab;
         
         document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
         tab.classList.add('active');
         
         document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
         document.getElementById(targetTab).classList.add('active');

         if (targetTab === 'calendar') {
             renderCalendar();
         } else if (targetTab === 'report') {
             updateMonthlyReport();
         }
     });
 });

 // Quote
 function showDailyQuote() {
     const today = new Date().toDateString();
     let savedQuote = localStorage.getItem('dailyQuote');
     let savedDate = localStorage.getItem('quoteDate');

     if (savedDate !== today || !savedQuote) {
         const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
         savedQuote = JSON.stringify(randomQuote);
         localStorage.setItem('dailyQuote', savedQuote);
         localStorage.setItem('quoteDate', today);
     }

     const quote = JSON.parse(savedQuote);
     document.getElementById('quoteText').textContent = quote.text;
     document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;
 }

 // Date
 function updateDate() {
     const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
     document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('en-US', options);
 }

 // Tasks
 function addTask() {
     const input = document.getElementById('taskInput');
     const time = document.getElementById('taskTime').value;
     const priority = document.getElementById('taskPriority').value;
     const text = input.value.trim();
     
     if (text === '') {
         showNotification('Error', 'Please enter a task');
         return;
     }
     
     const task = {
         id: Date.now(),
         text: text,
         time: time,
         priority: priority,
         completed: false,
         createdAt: new Date().toISOString()
     };
     
     tasks.push(task);
     input.value = '';
     document.getElementById('taskTime').value = '';
     
     renderTasks();
     saveData();
     showNotification('Task Added', 'New task added to your list');
 }

 function getLocalDateString(date = new Date()) {
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     return `${year}-${month}-${day}`;
 }

 function toggleTask(id) {
     const taskIndex = tasks.findIndex(t => t.id === id);
     if (taskIndex !== -1) {
         const task = tasks[taskIndex];
         tasks.splice(taskIndex, 1);
         task.completed = true;
         const now = new Date();
         task.completedAt = now.toISOString();
         completedTasks.push(task);
         
         // Mark completion in history with exact LOCAL date
         const dateKey = getLocalDateString(now);
         if (!completionHistory[dateKey]) {
             completionHistory[dateKey] = { tasks: 0, missions: 0 };
         }
         completionHistory[dateKey].tasks++;
         
         renderTasks();
         saveData();
         updateAllStats();
         renderCalendar();
         showNotification('Task Completed!', 'Great job!');
     }
 }

 function deleteTask(id, isCompleted = false) {
     if (isCompleted) {
         completedTasks = completedTasks.filter(t => t.id !== id);
     } else {
         tasks = tasks.filter(t => t.id !== id);
     }
     
     renderTasks();
     saveData();
     updateAllStats();
 }

 function renderTasks() {
     const taskList = document.getElementById('taskList');
     const completedList = document.getElementById('completedList');
     
     if (tasks.length === 0) {
         taskList.innerHTML = `
             <div class="empty-state">
                 <div class="empty-icon" style="font-size: 2rem; font-weight: bold;">&#9998;</div>
                 <div class="empty-text">No tasks yet</div>
                 <div class="empty-subtext">Add your first task to get started!</div>
             </div>
         `;
     } else {
         taskList.innerHTML = tasks.map(task => `
             <div class="task-item">
                 <div class="task-checkbox" onclick="toggleTask(${task.id})"></div>
                 <div class="task-content">
                     <div class="task-text">${task.text}</div>
                     <div class="task-meta">
                         <span class="task-priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                         ${task.time ? `<span class="task-time">&#128337; ${task.time}</span>` : ''}
                     </div>
                 </div>
                 <button class="task-delete" onclick="deleteTask(${task.id})">Delete</button>
             </div>
         `).join('');
     }
     
     if (completedTasks.length === 0) {
         completedList.innerHTML = `
             <div class="empty-state">
                 <div class="empty-icon" style="font-size: 2rem; font-weight: bold;">&#10004;</div>
                 <div class="empty-text">Nothing completed yet</div>
                 <div class="empty-subtext">Complete tasks to see them here</div>
             </div>
         `;
     } else {
         completedList.innerHTML = completedTasks.map(task => `
             <div class="task-item completed">
                 <div class="task-checkbox checked"></div>
                 <div class="task-content">
                     <div class="task-text">${task.text}</div>
                     <div class="task-meta">
                         <span class="task-priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                         ${task.time ? `<span class="task-time">&#128337; ${task.time}</span>` : ''}
                     </div>
                 </div>
                 <button class="task-delete" onclick="deleteTask(${task.id}, true)">Delete</button>
             </div>
         `).join('');
     }
     
     document.getElementById('taskCount').textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
     document.getElementById('completedCount').textContent = `${completedTasks.length} task${completedTasks.length !== 1 ? 's' : ''}`;
 }

 // Projects
 function openProjectModal() {
     document.getElementById('projectName').value = '';
     const container = document.getElementById('missionsContainer');
     container.innerHTML = '<h4 style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.95rem;">Daily Missions (10 days)</h4>';
     
     for (let i = 1; i <= 10; i++) {
         container.innerHTML += `
             <div class="form-group">
                 <label class="form-label">Day ${i} Mission</label>
                 <input type="text" class="form-input mission-input" placeholder="Mission for day ${i}">
             </div>
         `;
     }
     
     document.getElementById('projectModal').classList.add('active');
 }

 function closeProjectModal() {
     document.getElementById('projectModal').classList.remove('active');
 }

 function saveProject() {
     const name = document.getElementById('projectName').value.trim();
     const missionInputs = document.querySelectorAll('.mission-input');
     const missions = Array.from(missionInputs).map((input, index) => ({
         day: index + 1,
         text: input.value.trim(),
         completed: false
     }));

     if (name === '') {
         showNotification('Error', 'Please enter a project name');
         return;
     }

     if (missions.some(m => m.text === '')) {
         showNotification('Error', 'Please fill all mission fields');
         return;
     }

     const project = {
         id: Date.now(),
         name: name,
         missions: missions,
         startDate: new Date().toISOString(),
         currentDay: 1
     };

     projects.push(project);
     closeProjectModal();
     renderProjects();
     saveData();
     showNotification('Project Created', name + ' is ready to start!');
 }

 function renderProjects() {
     const projectsList = document.getElementById('projectsList');
     const activeProjectsList = document.getElementById('activeProjectsList');
     
     if (projects.length === 0) {
         const emptyState = `
             <div class="empty-state">
                 <div class="empty-icon" style="font-size: 2rem; font-weight: bold;">&#9733;</div>
                 <div class="empty-text">No projects yet</div>
                 <div class="empty-subtext">Create your first 10-day project</div>
             </div>
         `;
         projectsList.innerHTML = emptyState;
         activeProjectsList.innerHTML = emptyState;
     } else {
         const projectHTML = projects.map(project => {
             const completedMissions = project.missions.filter(m => m.completed).length;
             const progress = (completedMissions / 10) * 100;
             
             return `
                 <div class="project-card" onclick="openMissionModal(${project.id})">
                     <div class="project-header">
                         <div>
                             <div class="project-name">${project.name}</div>
                             <div class="project-days">Day ${project.currentDay} of 10</div>
                         </div>
                     </div>
                     <div class="project-progress-bar">
                         <div class="project-progress-fill" style="width: ${progress}%"></div>
                     </div>
                     <div class="project-stats">
                         <span>${completedMissions}/10 Missions</span>
                         <span>${Math.round(progress)}%</span>
                     </div>
                 </div>
             `;
         }).join('');
         
         projectsList.innerHTML = projectHTML;
         activeProjectsList.innerHTML = projectHTML;
     }
     
     updateMonthlyReport();
 }

 function openMissionModal(projectId) {
     const project = projects.find(p => p.id === projectId);
     if (!project) return;

     currentProject = project;
     document.getElementById('missionModalTitle').textContent = project.name;
     
     const missionsList = document.getElementById('missionsList');
     missionsList.innerHTML = project.missions.map((mission, index) => `
         <div class="task-item ${mission.completed ? 'completed' : ''}">
             <div class="task-checkbox ${mission.completed ? 'checked' : ''}" 
                  onclick="toggleMission(${projectId}, ${index})"></div>
             <div class="task-content">
                 <div class="task-text">Day ${mission.day}: ${mission.text}</div>
             </div>
         </div>
     `).join('');
     
     document.getElementById('missionModal').classList.add('active');
 }

 function closeMissionModal() {
     document.getElementById('missionModal').classList.remove('active');
     currentProject = null;
 }

 function toggleMission(projectId, missionIndex) {
     const project = projects.find(p => p.id === projectId);
     if (!project) return;

     project.missions[missionIndex].completed = !project.missions[missionIndex].completed;
     
     if (project.missions[missionIndex].completed) {
         const now = new Date();
         const dateKey = getLocalDateString(now);
         if (!completionHistory[dateKey]) {
             completionHistory[dateKey] = { tasks: 0, missions: 0 };
         }
         completionHistory[dateKey].missions++;
         showNotification('Mission Completed!', 'Keep up the great work!');
     } else {
         // If uncompleting, we should decrease the count
         const now = new Date();
         const dateKey = getLocalDateString(now);
         if (completionHistory[dateKey] && completionHistory[dateKey].missions > 0) {
             completionHistory[dateKey].missions--;
         }
     }

     const completedMissions = project.missions.filter(m => m.completed).length;
     project.currentDay = Math.min(completedMissions + 1, 10);
     
     openMissionModal(projectId);
     renderProjects();
     saveData();
     updateAllStats();
     renderCalendar();
 }

 // Events
 function openEventModal() {
     document.getElementById('eventName').value = '';
     document.getElementById('eventDate').value = '';
     document.getElementById('eventModal').classList.add('active');
 }

 function closeEventModal() {
     document.getElementById('eventModal').classList.remove('active');
 }

 function saveEvent() {
     const name = document.getElementById('eventName').value.trim();
     const date = document.getElementById('eventDate').value;

     if (name === '' || date === '') {
         showNotification('Error', 'Please fill all fields');
         return;
     }

     const event = {
         id: Date.now(),
         name: name,
         date: new Date(date).toISOString()
     };

     events.push(event);
     closeEventModal();
     renderEvents();
     saveData();
     showNotification('Event Added', name + ' has been added to your tracker');
 }

 function renderEvents() {
     const eventsList = document.getElementById('eventsList');
     
     if (events.length === 0) {
         eventsList.innerHTML = `
             <div class="empty-state">
                 <div class="empty-icon" style="font-size: 2rem; font-weight: bold;">&#9873;</div>
                 <div class="empty-text">No events tracked</div>
                 <div class="empty-subtext">Add important dates like exams or interviews</div>
             </div>
         `;
     } else {
         eventsList.innerHTML = events.map(event => `
             <div class="countdown-card" style="margin-bottom: 1rem;">
                 <div class="event-name">${event.name}</div>
                 <div class="countdown-display" id="countdown-${event.id}"></div>
             </div>
         `).join('');
     }
 }

 function updateCountdowns() {
     events.forEach(event => {
         const element = document.getElementById(`countdown-${event.id}`);
         if (!element) return;

         const now = new Date();
         const target = new Date(event.date);
         const diff = target - now;

         if (diff <= 0) {
             element.innerHTML = '<div style="color: var(--accent-success); font-weight: 700;">Event has passed!</div>';
             return;
         }

         const days = Math.floor(diff / (1000 * 60 * 60 * 24));
         const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
         const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
         const seconds = Math.floor((diff % (1000 * 60)) / 1000);

         element.innerHTML = `
             <div class="countdown-item">
                 <div class="countdown-value">${days}</div>
                 <div class="countdown-label">Days</div>
             </div>
             <div class="countdown-item">
                 <div class="countdown-value">${hours}</div>
                 <div class="countdown-label">Hours</div>
             </div>
             <div class="countdown-item">
                 <div class="countdown-value">${minutes}</div>
                 <div class="countdown-label">Min</div>
             </div>
             <div class="countdown-item">
                 <div class="countdown-value">${seconds}</div>
                 <div class="countdown-label">Sec</div>
             </div>
         `;
     });
 }

 // Timer
 function startTimer() {
     if (isRunning) {
         pauseTimer();
         return;
     }
     
     isRunning = true;
     document.getElementById('timerButton').textContent = 'Pause';
     
     timerInterval = setInterval(() => {
         if (timeLeft > 0) {
             timeLeft--;
             updateTimerDisplay();
         } else {
             completeSession();
         }
     }, 1000);
 }

 function pauseTimer() {
     isRunning = false;
     clearInterval(timerInterval);
     document.getElementById('timerButton').textContent = 'Resume';
 }

 function resetTimer() {
     isRunning = false;
     clearInterval(timerInterval);
     timeLeft = isBreak ? breakDuration * 60 : focusDuration * 60;
     document.getElementById('timerButton').textContent = 'Start';
     updateTimerDisplay();
 }

 function completeSession() {
     clearInterval(timerInterval);
     
     if (!isBreak) {
         stats.sessionsToday++;
         stats.focusTimeToday += focusDuration;
         showNotification('Focus Session Complete!', 'Time for a break');
     } else {
         showNotification('Break Complete!', 'Ready to focus again?');
     }
     
     isBreak = !isBreak;
     isRunning = false;
     timeLeft = isBreak ? breakDuration * 60 : focusDuration * 60;
     
     document.getElementById('timerMode').textContent = isBreak ? 'Break Time' : 'Focus Time';
     document.getElementById('timerButton').textContent = 'Start';
     
     updateTimerDisplay();
     updateAllStats();
     saveData();
 }

 function updateTimerDisplay() {
     const minutes = Math.floor(timeLeft / 60);
     const seconds = timeLeft % 60;
     const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
     
     document.getElementById('timerDisplay').textContent = display;
     
     const totalSeconds = isBreak ? breakDuration * 60 : focusDuration * 60;
     const progress = (totalSeconds - timeLeft) / totalSeconds;
     const circumference = 2 * Math.PI * 90;
     const offset = circumference * (1 - progress);
     
     document.getElementById('timerProgress').style.strokeDashoffset = offset;
 }

 function openTimerSettings() {
     document.getElementById('timerSettingsModal').classList.add('active');
 }

 function closeTimerSettings() {
     document.getElementById('timerSettingsModal').classList.remove('active');
 }

 function saveTimerSettings() {
     focusDuration = parseInt(document.getElementById('focusDuration').value);
     breakDuration = parseInt(document.getElementById('breakDuration').value);
     
     if (!isRunning) {
         timeLeft = isBreak ? breakDuration * 60 : focusDuration * 60;
         updateTimerDisplay();
     }
     
     closeTimerSettings();
     saveData();
     showNotification('Settings Saved', 'Timer preferences updated');
 }

 // Calendar
 function renderCalendar() {
     const year = calendarDate.getFullYear();
     const month = calendarDate.getMonth();
     
     const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
     
     document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;
     
     const firstDay = new Date(year, month, 1).getDay();
     const daysInMonth = new Date(year, month + 1, 0).getDate();
     const daysInPrevMonth = new Date(year, month, 0).getDate();
     
     let html = '';
     const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
     dayHeaders.forEach(day => {
         html += `<div class="calendar-day-header">${day}</div>`;
     });
     
     // Previous month days
     for (let i = firstDay - 1; i >= 0; i--) {
         html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
     }
     
     // Current month days
     const today = new Date();
     const todayDateString = getLocalDateString(today);
     
     for (let day = 1; day <= daysInMonth; day++) {
         const date = new Date(year, month, day);
         const dateKey = getLocalDateString(date);
         const isToday = dateKey === todayDateString;
         
         const history = completionHistory[dateKey];
         let classes = 'calendar-day';
         if (isToday) classes += ' today';
         if (date.getMonth() !== month) classes += ' other-month';
         if (history && history.tasks > 0) classes += ' has-task';
         if (history && history.missions > 0) classes += ' has-mission';
         
         html += `<div class="${classes}">${day}</div>`;
     }
     
     // Next month days
     const remainingCells = 42 - (firstDay + daysInMonth);
     for (let day = 1; day <= remainingCells; day++) {
         html += `<div class="calendar-day other-month">${day}</div>`;
     }
     
     document.getElementById('calendarGrid').innerHTML = html;
 }

 function changeMonth(delta) {
     calendarDate.setMonth(calendarDate.getMonth() + delta);
     renderCalendar();
 }

 // Monthly Report
 function updateMonthlyReport() {
     // Calculate monthly stats
     const currentMonth = new Date().getMonth();
     const currentYear = new Date().getFullYear();
     
     let monthTasks = 0;
     let monthMissions = 0;
     
     Object.keys(completionHistory).forEach(dateKey => {
         const date = new Date(dateKey);
         if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
             monthTasks += completionHistory[dateKey].tasks || 0;
             monthMissions += completionHistory[dateKey].missions || 0;
         }
     });
     
     document.getElementById('monthTotalTasks').textContent = monthTasks;
     document.getElementById('monthTotalMissions').textContent = monthMissions;
     document.getElementById('monthTotalSessions').textContent = stats.sessionsToday; // This should be cumulative
     
     // Calculate current streak
     let streak = 0;
     const sortedDates = Object.keys(completionHistory).sort().reverse();
     const todayDate = getLocalDateString();
     
     for (let i = 0; i < sortedDates.length; i++) {
         const date = sortedDates[i];
         const history = completionHistory[date];
         
         if (history.tasks > 0 || history.missions > 0) {
             const checkDate = new Date(date);
             const currentDate = new Date(todayDate);
             const daysDiff = Math.floor((currentDate - checkDate) / (1000 * 60 * 60 * 24));
             if (daysDiff === streak) {
                 streak++;
             } else {
                 break;
             }
         }
     }
     
     document.getElementById('monthActiveStreak').textContent = streak;
     
     // Activity chart
     const activityChart = document.getElementById('monthActivityChart');
     const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
     let chartHTML = '';
     
     for (let day = 1; day <= daysInMonth; day++) {
         const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
         const history = completionHistory[dateKey] || { tasks: 0, missions: 0 };
         const total = history.tasks + history.missions;
         const intensity = Math.min(total / 5, 1); // Max at 5 completions
         
         chartHTML += `
             <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
                 <span style="width: 60px; color: var(--text-secondary);">Day ${day}</span>
                 <div style="flex: 1; height: 20px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                     <div style="width: ${intensity * 100}%; height: 100%; background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)); transition: width 0.3s;"></div>
                 </div>
                 <span style="width: 40px; text-align: right; color: var(--text-secondary);">${total}</span>
             </div>
         `;
     }
     
     activityChart.innerHTML = chartHTML;
     
     // Project summary
     const projectSummary = document.getElementById('monthProjectSummary');
     if (projects.length === 0) {
         projectSummary.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No projects this month</p>';
     } else {
         projectSummary.innerHTML = projects.map(project => {
             const completed = project.missions.filter(m => m.completed).length;
             const percentage = Math.round((completed / 10) * 100);
             return `
                 <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.75rem;">
                     <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                         <span style="font-weight: 600;">${project.name}</span>
                         <span style="color: var(--accent-primary);">${completed}/10 missions</span>
                     </div>
                     <div style="height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                         <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));"></div>
                     </div>
                 </div>
             `;
         }).join('');
     }
 }

 function exportPerformanceReport() {
     // Generate text report
     const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
     
     let monthTasks = 0;
     let monthMissions = 0;
     
     const currentMonthNum = new Date().getMonth();
     const currentYear = new Date().getFullYear();
     
     Object.keys(completionHistory).forEach(dateKey => {
         const date = new Date(dateKey);
         if (date.getMonth() === currentMonthNum && date.getFullYear() === currentYear) {
             monthTasks += completionHistory[dateKey].tasks || 0;
             monthMissions += completionHistory[dateKey].missions || 0;
         }
     });
     
     // Calculate streak
     let streak = 0;
     const sortedDates = Object.keys(completionHistory).sort().reverse();
     const todayDate = new Date().toISOString().split('T')[0];
     
     for (let i = 0; i < sortedDates.length; i++) {
         const date = sortedDates[i];
         const history = completionHistory[date];
         
         if (history.tasks > 0 || history.missions > 0) {
             const daysDiff = Math.floor((new Date(todayDate) - new Date(date)) / (1000 * 60 * 60 * 24));
             if (daysDiff === streak) {
                 streak++;
             } else {
                 break;
             }
         }
     }
     
     let reportText = `TRUTH - PERFORMANCE REPORT
${currentMonth}
${'='.repeat(60)}

SUMMARY STATISTICS
------------------
Total Tasks Completed: ${monthTasks}
Total Missions Completed: ${monthMissions}
Focus Sessions: ${stats.sessionsToday}
Current Streak: ${streak} days

PROJECTS
--------
`;
     
     if (projects.length === 0) {
         reportText += 'No projects this month\n';
     } else {
         projects.forEach(project => {
             const completed = project.missions.filter(m => m.completed).length;
             const percentage = Math.round((completed / 10) * 100);
             reportText += `${project.name}: ${completed}/10 missions (${percentage}%)\n`;
         });
     }
     
     reportText += `
${'='.repeat(60)}
Generated on: ${new Date().toLocaleString()}
`;
     
     // Create and download text file
     const blob = new Blob([reportText], { type: 'text/plain' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `truth-report-${currentMonth.replace(' ', '-')}.txt`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
     
     showNotification('Report Exported!', 'Your performance report has been downloaded');
 }

 // Stats
 function updateAllStats() {
     const todayTaskCount = completedTasks.length;
     const todayMissions = Object.values(projects).reduce((sum, p) => 
         sum + p.missions.filter(m => m.completed).length, 0);
     
     document.getElementById('todayTasks').textContent = todayTaskCount;
     document.getElementById('todayMissions').textContent = todayMissions;
     document.getElementById('focusTime').textContent = `${stats.focusTimeToday}m`;
     document.getElementById('sessionsToday').textContent = stats.sessionsToday;
     document.getElementById('totalFocusTime').textContent = `${stats.focusTimeToday}m`;
     
     // Calculate streak
     let streak = 0;
     const sortedDates = Object.keys(completionHistory).sort().reverse();
     const todayDate = getLocalDateString();
     
     for (let i = 0; i < sortedDates.length; i++) {
         const date = sortedDates[i];
         const history = completionHistory[date];
         
         if (history.tasks > 0 || history.missions > 0) {
             const checkDate = new Date(date);
             const currentDate = new Date(todayDate);
             const daysDiff = Math.floor((currentDate - checkDate) / (1000 * 60 * 60 * 24));
             if (daysDiff === streak) {
                 streak++;
             } else {
                 break;
             }
         }
     }
     
     document.getElementById('streakCount').textContent = streak;
 }

 // Notifications
 function showNotification(title, message) {
     const notification = document.getElementById('notification');
     document.getElementById('notificationTitle').textContent = title;
     document.getElementById('notificationMessage').textContent = message;
     
     notification.classList.add('show');
     
     setTimeout(() => {
         notification.classList.remove('show');
     }, 3000);
 }

 // Data persistence
 function saveData() {
     const data = {
         tasks,
         completedTasks,
         projects,
         events,
         stats,
         focusDuration,
         breakDuration,
         completionHistory
     };
     localStorage.setItem('truthAppData', JSON.stringify(data));
 }

 function loadData() {
     const saved = localStorage.getItem('truthAppData');
     if (saved) {
         const data = JSON.parse(saved);
         tasks = data.tasks || [];
         completedTasks = data.completedTasks || [];
         projects = data.projects || [];
         events = data.events || [];
         stats = data.stats || { sessionsToday: 0, focusTimeToday: 0 };
         focusDuration = data.focusDuration || 25;
         breakDuration = data.breakDuration || 5;
         completionHistory = data.completionHistory || {};
         
         document.getElementById('focusDuration').value = focusDuration;
         document.getElementById('breakDuration').value = breakDuration;
         
         renderTasks();
         renderProjects();
         renderEvents();
     }
 }

 // Enter key handlers
 document.getElementById('taskInput').addEventListener('keypress', (e) => {
     if (e.key === 'Enter') addTask();
 });

 document.getElementById('projectName').addEventListener('keypress', (e) => {
     if (e.key === 'Enter') saveProject();
 });

 // Close modals on outside click
 document.querySelectorAll('.modal').forEach(modal => {
     modal.addEventListener('click', (e) => {
         if (e.target === modal) {
             modal.classList.remove('active');
         }
     });
 });