---
  layout: null
sitemap:
exclude: 'yes'
---

  (function () {
    var panelCover = document.querySelector('.panel-cover')
    var contentWrapper = document.querySelector('.content-wrapper')
    var mobileMenuButton = document.querySelector('.btn-mobile-menu')
    var mobileMenuIcon = document.querySelector('.btn-mobile-menu__icon')
    var navigationWrapper = document.querySelector('.navigation-wrapper')
    var blogButtons = document.querySelectorAll('a.blog-button')

    function shouldCollapseOnLoad () {
      var searchParams = new URLSearchParams(window.location.search)
      return searchParams.get('cover_collapsed') === 'true'
    }

    function collapsePanel () {
      if (!panelCover || panelCover.classList.contains('panel-cover--collapsed')) return
      panelCover.classList.add('panel-cover--collapsed')

      if (contentWrapper) {
        contentWrapper.classList.add('animated', 'slideInRight')
      }
    }

    function toggleMobileMenu () {
      if (!navigationWrapper || !mobileMenuIcon) return

      navigationWrapper.classList.toggle('visible')
      navigationWrapper.classList.toggle('animated')
      navigationWrapper.classList.toggle('bounceInDown')
      mobileMenuIcon.classList.toggle('icon-list')
      mobileMenuIcon.classList.toggle('icon-x-circle')
      mobileMenuIcon.classList.toggle('animated')
      mobileMenuIcon.classList.toggle('fadeIn')
    }

    blogButtons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        if (!panelCover || panelCover.classList.contains('panel-cover--collapsed')) return

        event.preventDefault()
        collapsePanel()
      })
    })

    if (mobileMenuButton) {
      mobileMenuButton.addEventListener('click', toggleMobileMenu)
    }

    if (shouldCollapseOnLoad() || (window.location.pathname !== '{{ site.baseurl }}/' && window.location.pathname !== '{{ site.baseurl }}/index.html')) {
      collapsePanel()
    }
  })()
