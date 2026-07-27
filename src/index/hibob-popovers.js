import tippy from 'tippy.js'

import 'tippy.js/dist/tippy.css'
import '../styles/hibob-popovers.css'

function buildTestimonialPopoverContent(trigger) {
  const name = trigger.getAttribute('data-popover-title') || ''
  const role = trigger.getAttribute('data-popover-role') || ''
  const text = trigger.getAttribute('data-popover-text') || ''
  const img = trigger.getAttribute('data-popover-image') || ''
  const link =
    trigger.getAttribute('data-popover-link') || trigger.getAttribute('href') || '#'
  const companyLogo = trigger.getAttribute('data-popover-company-logo') || ''

  const wrap = document.createElement('div')
  wrap.className = 'hibob-popover hibob-popover-testimonial'
  wrap.innerHTML =
    '<button type="button" class="hibob-popover-close" aria-label="Close">&times;</button>' +
    '<div class="hibob-popover-person">' +
    (img ? `<img class="hibob-popover-avatar" src="${img}" alt="${name}" />` : '') +
    '<div class="hibob-popover-person-info">' +
    (name ? `<div class="hibob-popover-person-name">${name}</div>` : '') +
    (role ? `<div class="hibob-popover-person-role">${role}</div>` : '') +
    '</div>' +
    '</div>' +
    (text ? `<p class="hibob-popover-quote">"${text}"</p>` : '') +
    `<a class="hibob-popover-company-link" target="_blank" rel="noopener" href="${link}">` +
    (companyLogo
      ? `<img class="hibob-popover-company-logo" src="${companyLogo}" alt="${name}" />`
      : 'Visit website &rarr;') +
    '</a>'
  return wrap
}

function buildCaseStudyPopoverContent(trigger) {
  const title = trigger.getAttribute('data-popover-title') || ''
  const text = trigger.getAttribute('data-popover-text') || ''
  const img = trigger.getAttribute('data-popover-image') || ''
  const link =
    trigger.getAttribute('data-popover-link') || trigger.getAttribute('href') || '#'
  const personImg = trigger.getAttribute('data-popover-person-image') || ''
  const personName = trigger.getAttribute('data-popover-person-name') || ''
  const personRole = trigger.getAttribute('data-popover-role') || ''
  const companyLogo = trigger.getAttribute('data-popover-company-logo') || ''

  const wrap = document.createElement('div')
  wrap.className = 'hibob-popover'
  wrap.innerHTML =
    '<button type="button" class="hibob-popover-close" aria-label="Close">&times;</button>' +
    (img ? `<img src="${img}" alt="${title}" />` : '') +
    (text ? `<p class="hibob-popover-quote">${text}</p>` : '') +
    (personImg || personName
      ? '<div class="hibob-popover-mini-row">' +
        (personImg
          ? `<img class="hibob-popover-mini-avatar" src="${personImg}" alt="" />`
          : '') +
        (personName || personRole
          ? '<div class="hibob-popover-mini-info">' +
            (personName
              ? `<div class="hibob-popover-mini-name">${personName}</div>`
              : '') +
            (personRole
              ? `<div class="hibob-popover-mini-role">${personRole}</div>`
              : '') +
            '</div>'
          : '') +
        '</div>'
      : '') +
    (companyLogo
      ? `<img class="hibob-popover-standalone-logo" src="${companyLogo}" alt="${title}" />`
      : '') +
    `<a class="hibob-popover-link" href="${link}">Case study &rarr;</a>`
  return wrap
}

function initHibobPopoverTrigger(trigger) {
  if (!trigger || trigger.__hibobTippyInit) return
  trigger.__hibobTippyInit = true

  const isTestimonial = trigger.hasAttribute('data-testimonial-index')

  trigger.addEventListener('click', (e) => e.preventDefault())

  tippy(trigger, {
    content: isTestimonial
      ? buildTestimonialPopoverContent(trigger)
      : buildCaseStudyPopoverContent(trigger),
    allowHTML: true,
    interactive: true,
    appendTo: document.body,
    theme: 'hibob',
    trigger: 'mouseenter click focus',
    hideOnClick: true,
    placement: 'bottom',
    offset: [0, 10],
    maxWidth: 310,
    zIndex: 500,
    popperOptions: {
      modifiers: [{ name: 'flip', enabled: false }],
    },
    onShow: (instance) => {
      const closeBtn = instance.popper.querySelector('.hibob-popover-close')
      if (closeBtn) {
        closeBtn.addEventListener('click', (ev) => {
          ev.stopPropagation()
          instance.hide()
        })
      }
    },
  })
}

export default function initHibobPopovers() {
  const triggers = document.querySelectorAll('[data-popover-title]')
  triggers.forEach((trigger) => initHibobPopoverTrigger(trigger))
}
