import {
  initHomeSwipers,
  initFaqs,
  splitTextAnimation,
  langaugeToggle,
  initCounter,
  initNavigation,
  linkedinAdsConversion,
} from './index'

const getCurrentPath = () => window.location.pathname

const loadScripts = () => {
  const currentPath = getCurrentPath()

  initNavigation()
  linkedinAdsConversion()

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
