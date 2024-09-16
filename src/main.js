import {
  initHomeSwipers,
  initFaqs,
  splitTextAnimation,
  langaugeToggle,
  initCounter,
  initNavigation,
  linkedinAdsConversion,
  initCookieModal,
} from './index'

const getCurrentPath = () => window.location.pathname

const loadScripts = () => {
  const currentPath = getCurrentPath()

  initNavigation()
  linkedinAdsConversion()
  initCookieModal()

  if (currentPath === '/') {
    initHomeSwipers()
    splitTextAnimation()
    initCounter()
    langaugeToggle()
    initFaqs()
  }

  if (currentPath.includes('/faq')) {
    initFaqs()
  }
}

loadScripts()
