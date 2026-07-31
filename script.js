const VITE_API_BASE_URL = "https://gccwebsite-admin-backend-738131651355.asia-south1.run.app";
// const VITE_API_PROD_URL="https://gccwebsite-admin-prod-backend-738131651355.asia-south1.run.app";

// window.GCC_Base_url = VITE_API_BASE_URL;
window.GCC_Base_url = VITE_API_PROD_URL;

var TRACKING_KEYS = [
    'utm_medium',
    'utm_source',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'utm_id',
    'fbc_id',
    'utm_adname',
    'campaign_id',
    'adset_id',
    'fbclid',
    'ad_source',
    'ad_id',
    'utm_adgroupid',
    'utm_creativeid',
    'utm_matchtype',
    'utm_device',
    'utm_network',
    'utm_keyword',
    'gad_source',
    'gad_campaignid',
    'gbraid',
    'wbraid',
    'gclid'
];

var TRACKING_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
var TRACKING_TS_KEY = 'gcc_utm_timestamp';

function initTracking() {
    var urlParams = new URLSearchParams(window.location.search);
    var incoming = {};
    var hasAnyParam = false;

    TRACKING_KEYS.forEach(function (key) {
        var val = urlParams.get(key);
        if (val) {
            incoming[key] = val;
            hasAnyParam = true;
        }
    });

    // Only touch storage if this visit actually carries tracking params.
    // This prevents a new partial UTM set merging with old leftover values.
    if (hasAnyParam) {
        // Clear the previous full set first
        TRACKING_KEYS.forEach(function (key) {
            try {
                sessionStorage.removeItem('gcc_' + key);
                localStorage.removeItem('gcc_' + key);
            } catch (e) {
                console.warn('Storage clear error for ' + key + ':', e);
            }
        });

        // Write the new set fresh
        Object.keys(incoming).forEach(function (key) {
            try {
                sessionStorage.setItem('gcc_' + key, incoming[key]);
                localStorage.setItem('gcc_' + key, incoming[key]);
            } catch (e) {
                console.warn('Storage write error for ' + key + ':', e);
            }
        });

        try {
            localStorage.setItem(TRACKING_TS_KEY, String(Date.now()));
        } catch (e) {
            console.warn('Storage write error for timestamp:', e);
        }
    } else {
        // No params on this visit — check if the stored set has expired
        try {
            var ts = parseInt(localStorage.getItem(TRACKING_TS_KEY), 10);
            if (ts && (Date.now() - ts > TRACKING_TTL_MS)) {
                TRACKING_KEYS.forEach(function (key) {
                    sessionStorage.removeItem('gcc_' + key);
                    localStorage.removeItem('gcc_' + key);
                });
                localStorage.removeItem(TRACKING_TS_KEY);
            }
        } catch (e) {
            console.warn('Storage expiry check error:', e);
        }
    }
}

function getTrackingParams() {
    var params = {};
    var urlParams = new URLSearchParams(window.location.search);

    TRACKING_KEYS.forEach(function (key) {
        var val = urlParams.get(key);
        if (!val) {
            try {
                val = sessionStorage.getItem('gcc_' + key) || localStorage.getItem('gcc_' + key);
            } catch (e) {
                // Ignore storage read error
            }
        }
        if (val) {
            params[key] = val;
        }
    });

    return params;
}

function populateFormUTMFields() {
    var params = getTrackingParams();
    var forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
        Object.keys(params).forEach(function (key) {
            var input = form.querySelector('input[name="' + key + '"]');
            if (input) {
                input.value = params[key];
            } else {
                var hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = key;
                hiddenInput.value = params[key];
                form.appendChild(hiddenInput);
            }
        });
    });
}

// Run immediately
initTracking();
// Run on DOMContentLoaded or immediately to populate existing forms
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateFormUTMFields);
} else {
    populateFormUTMFields();
}

/* ════════════════ CONFIG ════════════════
   Drive deadline drives every countdown on the page.
   Change DEADLINE to your real cut-off (local time). */
var DEADLINE = new Date('2026-08-10T23:59:59+05:30').getTime();

/* ════════════════ COUNTDOWN ════════════════ */
(function () {
    function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, '0'); }
    var els = {
        sd: document.getElementById('t-d'), sh: document.getElementById('t-h'),
        sm: document.getElementById('t-m'), ss: document.getElementById('t-s'),
        hd: document.getElementById('h-d'), hh: document.getElementById('h-h'),
        hm: document.getElementById('h-m'), hs: document.getElementById('h-s'),
        bar: document.getElementById('bar-timer')
    };
    function tick() {
        var diff = DEADLINE - Date.now();
        if (diff < 0) diff = 0;
        var d = diff / 86400000, h = diff % 86400000 / 3600000, m = diff % 3600000 / 60000, s = diff % 60000 / 1000;
        if (els.sd) { els.sd.textContent = pad(d); els.sh.textContent = pad(h); els.sm.textContent = pad(m); els.ss.textContent = pad(s); }
        if (els.hd) { els.hd.textContent = pad(d); els.hh.textContent = pad(h); els.hm.textContent = pad(m); els.hs.textContent = pad(s); }
        if (els.bar) els.bar.textContent = pad(d) + 'd ' + pad(h) + 'h';
    }
    tick(); setInterval(tick, 1000);
})();

/* ════════════════ FORM HANDLING + META LEAD EVENT ════════════════ */
(function () {
    function showErr(input, on) {
        var err = input.parentNode.querySelector('.field-error[data-for="' + input.name + '"]');
        if (err) err.style.display = on ? 'block' : 'none';
        input.style.borderColor = on ? 'var(--c-red)' : '';
    }
    function validate(form) {
        var ok = true;
        form.querySelectorAll('[required]').forEach(function (inp) {
            var v = inp.value.trim(), bad = false;
            if (!v) bad = true;
            else if (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) bad = true;
            else if (inp.type === 'tel' && v.replace(/\D/g, '').length < 10) bad = true;
            if (bad) ok = false;
            showErr(inp, bad);
        });
        return ok;
    }
    /* ════════════════ CALENDAR POPUP SYSTEM ════════════════ */
    var activeLeadId = null;
    var activeSlotData = [];
    var activeFormElement = null;
    var activeSuccessElement = null;
    var calendarCurrentDate = new Date(2026, 6, 1); // Start at June 2026
    var selectedDateStr = null;

    var calModal = document.getElementById('calendar-modal');
    var calMonthYear = document.getElementById('cal-month-year');
    var calDaysContainer = document.getElementById('calendar-days');
    var calPrevBtn = document.getElementById('cal-prev-btn');
    var calNextBtn = document.getElementById('cal-next-btn');
    var bookSlotBtn = document.getElementById('book-slot-btn');
    var slotsDisplay = document.getElementById('slots-count-display');
    var calCloseBtn = document.getElementById('calendar-modal-close');
    var calDocCheckbox = document.getElementById('cal-doc-checkbox');

    function openCalendarPopup(leadId, slotData, form, success) {
        activeLeadId = leadId;
        activeSlotData = slotData || [];
        activeFormElement = form;
        activeSuccessElement = success;
        selectedDateStr = null;

        if (calDocCheckbox) {
            calDocCheckbox.checked = false;
        }

        bookSlotBtn.disabled = true;
        bookSlotBtn.textContent = 'Book Slot →';
        slotsDisplay.textContent = 'Please select an available slot (green) in the calendar.';
        slotsDisplay.style.color = 'var(--c-text-m)';

        if (form) {
            form.reset();
            form.querySelectorAll('input,select').forEach(function (inp) {
                showErr(inp, false);
            });
        }

        calendarCurrentDate = new Date();
        calendarCurrentDate.setDate(1);

        renderCalendar();
        calModal.style.display = 'flex';
        document.body.classList.add('modal-open');
        var cardBody = calModal.querySelector('.card-body');
        if (cardBody) {
            cardBody.scrollTop = 0;
        }
    }

    function closeCalendarPopup() {
        calModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    const MAX_SLOTS = 30;

    function renderCalendar() {
        var year = calendarCurrentDate.getFullYear();
        var month = calendarCurrentDate.getMonth();

        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        calMonthYear.textContent = monthNames[month] + " " + year;

        calDaysContainer.innerHTML = '';

        var firstDay = new Date(year, month, 1);
        var offset = (firstDay.getDay() + 6) % 7;
        var totalDays = new Date(year, month + 1, 0).getDate();

        for (var i = 0; i < offset; i++) {
            var emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell empty';
            calDaysContainer.appendChild(emptyCell);
        }

        for (var day = 1; day <= totalDays; day++) {
            var dayCell = document.createElement('button');
            dayCell.type = 'button';
            dayCell.className = 'cal-day-cell';

            var dateString = String(day).padStart(2, '0') + '-' + String(month + 1).padStart(2, '0') + '-' + year;
            dayCell.setAttribute('data-date', dateString);

            var cellDate = new Date(year, month, day);
            var today = new Date();
            today.setHours(0, 0, 0, 0);

            var cutoffDate = new Date(today);
            cutoffDate.setDate(today.getDate() + 2);

            var isPast = cellDate < cutoffDate;
            var currentDayOfWeek = cellDate.getDay();
            var isWeekend = (currentDayOfWeek === 0 || currentDayOfWeek === 6);
            if (isWeekend) {
                dayCell.classList.add('weekend');
            }

            var slotObj = activeSlotData.find(function (item) {
                return item.date === dateString;
            });

            var booked = slotObj ? parseInt(slotObj.count, 10) : 0;
            var remaining = MAX_SLOTS - booked;

            dayCell.setAttribute('data-booked', booked);
            dayCell.setAttribute('data-remaining', remaining);

            var dayNumSpan = document.createElement('span');
            dayNumSpan.textContent = day;
            dayCell.appendChild(dayNumSpan);

            var slotsSpan = document.createElement('span');
            slotsSpan.className = 'cal-slots';

            if (isPast) {
                slotsSpan.textContent = "-";
                dayCell.classList.add("unavailable");
                dayCell.disabled = true;
            } else if (isWeekend) {
                slotsSpan.textContent = "-";
                dayCell.classList.add("unavailable");
                dayCell.disabled = true;
            } else if (!slotObj) {
                slotsSpan.textContent = "-";
                dayCell.classList.add("unavailable");
                dayCell.disabled = true;
            } else if (remaining <= 0) {
                slotsSpan.textContent = "Full";
                dayCell.classList.add("full");
                dayCell.disabled = true;
            } else {
                slotsSpan.textContent =
                    remaining + (remaining === 1 ? " Slot Left" : " Slots Left");
                dayCell.classList.add("available");

                // Optional color classes
                if (remaining <= 3) {
                    dayCell.classList.add("few-slots");
                } else if (remaining <= 10) {
                    dayCell.classList.add("medium-slots");
                } else {
                    dayCell.classList.add("many-slots");
                }
            }

            dayCell.appendChild(slotsSpan);

            if (dayCell.classList.contains('available')) {
                dayCell.addEventListener('click', function () {
                    var prevSelected = calDaysContainer.querySelector('.cal-day-cell.selected');
                    if (prevSelected) {
                        prevSelected.classList.remove('selected');
                    }

                    this.classList.add('selected');
                    selectedDateStr = this.getAttribute('data-date');
                    var remaining = this.getAttribute("data-remaining");

                    slotsDisplay.innerHTML =
                        "<strong>" +
                        remaining +
                        (remaining == 1 ? " Slot Available" : " Slots Available") +
                        "</strong><br>" +
                        "Selected Date : " +
                        selectedDateStr;
                    slotsDisplay.style.color = 'var(--c-green)';
                    updateBookSlotButtonState();
                });
            }

            if (selectedDateStr === dateString) {
                dayCell.classList.add('selected');
            }

            calDaysContainer.appendChild(dayCell);
        }
    }

    calPrevBtn.addEventListener('click', function () {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        renderCalendar();
    });

    calNextBtn.addEventListener('click', function () {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        renderCalendar();
    });

    calCloseBtn.addEventListener('click', closeCalendarPopup);
    calModal.addEventListener('click', function (e) {
        if (e.target === calModal) {
            closeCalendarPopup();
        }
    });

    if (calDocCheckbox) {
        calDocCheckbox.addEventListener('change', function () {
            updateBookSlotButtonState();
        });
    }

    function updateBookSlotButtonState() {
        if (selectedDateStr && calDocCheckbox && calDocCheckbox.checked) {
            bookSlotBtn.disabled = false;
        } else {
            bookSlotBtn.disabled = true;
        }
    }

    bookSlotBtn.addEventListener('click', function () {
        if (!selectedDateStr || !activeLeadId) return;
        if (calDocCheckbox && !calDocCheckbox.checked) return;

        bookSlotBtn.disabled = true;
        bookSlotBtn.textContent = 'Booking Slot...';

        var baseUrl = window.GCC_Base_url || "https://gccwebsite-admin-backend-738131651355.asia-south1.run.app";

        var parts = selectedDateStr.split('-');
        var yyyymmdd = parts[2] + '-' + parts[1] + '-' + parts[0];

        fetch(baseUrl + '/api/students/create-student-interview-slot/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lid: parseInt(activeLeadId, 10),
                interview_date: yyyymmdd,
                ...getTrackingParams()
            })
        })
            .then(function (res2) {
                console.log('Create student interview slot status:', res2.status);
                return res2.json().catch(function () { return {}; });
            })
            .then(function (data2) {
                console.log('Create student interview slot payload:', data2);
                completeBooking();
            })
            .catch(function (err) {
                console.warn('Booking API error (proceeding in mock mode):', err);
                completeBooking();
            });
    });

    function completeBooking() {
        calModal.style.display = 'none';
        document.body.classList.remove('modal-open');

        if (activeFormElement && activeSuccessElement) {
            activeFormElement.style.display = 'none';

            var stepContainer = activeFormElement.closest('.step');
            if (stepContainer) {
                var kicker = stepContainer.querySelector('.q-kicker');
                var title = stepContainer.querySelector('.q-title');
                if (kicker) kicker.style.display = 'none';
                if (title) title.style.display = 'none';
            }

            var successP = activeSuccessElement.querySelector('p');
            if (successP) {
                successP.innerHTML = 'Your slot is booked for <strong>' + selectedDateStr + '</strong>. Keep your phone handy. We will call you within 24 hours to confirm your slot.';
            }

            activeSuccessElement.style.display = 'block';
        }
    }

    /* ════════════════ FORM REGISTRATION HANDLER ════════════════ */
    function handle(formId, successId) {
        var form = document.getElementById(formId);
        if (!form) return;
        var success = document.getElementById(successId);
        form.querySelectorAll('input,select').forEach(function (inp) {
            inp.addEventListener('input', function () { showErr(inp, false); });
            inp.addEventListener('change', function () { showErr(inp, false); });
        });
        form.addEventListener('reset', function () {
            var citySelect = form.querySelector('select[name="city"]');
            if (citySelect) {
                citySelect.innerHTML = '<option value="" disabled selected>City</option>';
            }
        });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validate(form)) return;

            var data = Object.fromEntries(new FormData(form).entries());

            /* Fire conversion events */
            if (window.fbq) fbq('track', 'Lead', { content_name: 'Hiring Drive Jun-Jul 2026', state: data.state, city: data.city });
            if (window.gtag) gtag('event', 'generate_lead', { event_category: 'hiring_drive', state: data.state, city: data.city });
            if (window.dataLayer) window.dataLayer.push({ event: 'lead_submit', form: formId, state: data.state, city: data.city });

            var payload = {
                full_name: data.name,
                email: data.email,
                phone: data.phone,
                state: data.state,
                city: data.city,
                source: 21,
                degree: data.degree || "",
                age_range: data.age_range || "",
                degree_stage: data.degree_stage || "",
                fund_mode: data.fund_mode || "",
                attend_from: data.attend_from || "",
                ...getTrackingParams()
            };

            var baseUrl = window.GCC_Base_url || "https://gccwebsite-admin-backend-738131651355.asia-south1.run.app";

            var submitBtn = form.querySelector('button[type="submit"]');
            var originalBtnText = submitBtn ? submitBtn.textContent : 'Submit';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registering...';
            }

            fetch(baseUrl + '/api/career/createdossiercustomform', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(function (res) {
                    if (!res.ok) {
                        throw new Error('API request failed');
                    }
                    return res.json();
                })
                .then(function (result) {
                    console.log('Submission successful:', result);
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                    if (result.success && result.data) {
                        openCalendarPopup(result.data.id, result.data.slot_data, form, success);
                    } else {
                        form.style.display = 'none';
                        if (success) success.style.display = 'block';
                    }
                })
                .catch(function (err) {
                    console.error('Error submitting form:', err);
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                    alert('Something went wrong. Please try again.');
                });
        });
    }
    /* ════════════════ STATE-CITY DROPDOWN LOADER ════════════════ */
    var stateCityData = null;

    function initializeStateCityDropdowns() {
        if (!stateCityData) return;
        var states = Object.keys(stateCityData).sort();

        var stateSelects = document.querySelectorAll('select[name="state"]');
        stateSelects.forEach(function (stateSelect) {
            // Keep only placeholder option
            stateSelect.innerHTML = '<option value="" disabled selected>State</option>';
            states.forEach(function (state) {
                var opt = document.createElement('option');
                opt.value = state;
                opt.textContent = state;
                stateSelect.appendChild(opt);
            });

            stateSelect.addEventListener('change', function () {
                var form = stateSelect.closest('form');
                if (!form) return;
                var citySelect = form.querySelector('select[name="city"]');
                if (!citySelect) return;

                citySelect.innerHTML = '<option value="" disabled selected>City</option>';

                var selectedState = stateSelect.value;
                if (selectedState && stateCityData[selectedState]) {
                    var cities = stateCityData[selectedState].slice().sort();
                    cities.forEach(function (city) {
                        var opt = document.createElement('option');
                        opt.value = city;
                        opt.textContent = city;
                        citySelect.appendChild(opt);
                    });
                }
            });
        });
    }

    if (window.STATE_CITY_DATA) {
        stateCityData = window.STATE_CITY_DATA;
        initializeStateCityDropdowns();
    } else {
        console.error("STATE_CITY_DATA is not loaded. Make sure state-city.js is included.");
    }

    window.openCalendarPopup = openCalendarPopup;
    window.initializeStateCityDropdowns = initializeStateCityDropdowns;
    handle('lead-form', 'form-success');
    handle('lead-form-2', 'form-success-2');
    handle('lead-form-3', 'form-success-3');
})();

/* ════════════════ MODAL (timed + exit intent, once per session) ════════════════ */
(function () {
    var modal = document.getElementById('enroll-modal');
    var shown = false;
    function show() {
        if (shown || sessionStorage.getItem('gcc_modal')) return;
        shown = true; sessionStorage.setItem('gcc_modal', '1');
        modal.style.display = 'flex'; document.body.classList.add('modal-open');
    }
    function hide() {
        modal.style.display = 'none'; document.body.classList.remove('modal-open');
    }
    setTimeout(show, 18000);
    document.addEventListener('mouseout', function (e) { if (e.clientY <= 0) show(); });
    document.getElementById('modal-close').addEventListener('click', hide);
    modal.addEventListener('click', function (e) { if (e.target === modal) hide(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
})();

/* ════════════════ STICKY BAR (after scroll past hero) ════════════════ */
(function () {
    var bar = document.getElementById('sticky-bar');
    var hero = document.querySelector('.hero');
    if (!bar || !hero) return;
    window.addEventListener('scroll', function () {
        if (window.scrollY > hero.offsetHeight - 80) bar.style.transform = 'translateY(0)';
        else bar.style.transform = 'translateY(100%)';
    }, { passive: true });
})();

/* ════════════════ FAQ ACCORDION ════════════════ */
document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var item = btn.parentNode, a = item.querySelector('.faq-a');
        var open = item.classList.toggle('open');
        a.style.maxHeight = open ? a.scrollHeight + 'px' : '0';
    });
});

/* ════════════════ FADE-UP ON SCROLL ════════════════ */
(function () {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.fade-up').forEach(function (el) { el.classList.add('in'); }); return;
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('.fade-up').forEach(function (el) { io.observe(el); });
})();

function stopAllTestimonialVideos() {
    // Pause native testimonial videos
    document.querySelectorAll(".testimonial-video").forEach(v => {
        v.pause();
        v.currentTime = 0;
        const card = v.closest(".video-card");
        if (card) {
            const playBtn = card.querySelector(".play-btn");
            if (playBtn) playBtn.classList.remove("hide");
        }
    });

    // Remove YouTube testimonial iframes and restore their thumbnails
    document.querySelectorAll(".video-thumb iframe").forEach(iframe => {
        const thumb = iframe.closest(".video-thumb");
        if (thumb) {
            const card = thumb.closest(".video-card");
            const playBtn = card ? card.querySelector(".play-btn") : null;
            const img = thumb.querySelector("img");
            if (img) img.style.display = "block";
            if (playBtn) playBtn.classList.remove("hide");
        }
        iframe.remove();
    });
}

document.querySelectorAll(".video-card").forEach(card => {
    const playBtn = card.querySelector(".play-btn");
    if (!playBtn) return;

    const videoThumb = card.querySelector(".video-thumb");
    const video = card.querySelector("video");
    const youtubeId = videoThumb ? videoThumb.dataset.youtubeId : null;

    if (video) {
        // Native video logic
        playBtn.addEventListener("click", () => {
            stopAllTestimonialVideos();
            video.play();
            playBtn.classList.add("hide");
        });

        video.addEventListener("ended", () => {
            playBtn.classList.remove("hide");
            video.currentTime = 0;
        });

        video.addEventListener("pause", () => {
            if (!video.ended) {
                playBtn.classList.remove("hide");
            }
        });
    } else if (youtubeId) {
        // YouTube video logic
        playBtn.addEventListener("click", () => {
            stopAllTestimonialVideos();

            // Create and append the YouTube iframe
            const iframe = document.createElement("iframe");
            iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1`;
            iframe.title = "YouTube video player";
            iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
            iframe.setAttribute("allowfullscreen", "true");
            
            const img = videoThumb.querySelector("img");
            if (img) img.style.display = "none";
            playBtn.classList.add("hide");
            
            videoThumb.appendChild(iframe);
        });
    }
});

/* ════════════════ BLOG VIDEO PLAYBACK ════════════════ */
document.querySelectorAll('.video-player-wrap').forEach(wrap => {
    const playBtn = wrap.querySelector('.blog-play-overlay-btn');
    const video = wrap.querySelector('.blog-inline-video');
    const img = wrap.querySelector('.blog-video-cover');

    if (playBtn && video && img) {
        const startVideo = () => {
            stopAllTestimonialVideos();

            // Play this inline video
            img.style.display = 'none';
            playBtn.style.display = 'none';
            video.style.display = 'block';
            video.play();
        };

        playBtn.addEventListener('click', startVideo);
        img.addEventListener('click', startVideo);
    }
});
