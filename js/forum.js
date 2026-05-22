---
layout: null
sitemap:
exclude: 'yes'
---

(function () {
  var STORAGE_KEY = 'tuning-center-foro-threads-v1'
  var SITE_BASE_URL = '{{ site.baseurl }}'
  var THREAD_PAGE_URL = SITE_BASE_URL + '/thread/'

  var defaultThreads = [
    {% for post in site.posts %}
    {
      id: {{ post.id | jsonify }},
      title: {{ post.title | jsonify }},
      body: {{ post.content | strip_html | strip_newlines | strip | jsonify }},
      category: {{ post.category | default: 'General' | jsonify }},
      author: {{ post.author | default: 'User0000' | jsonify }},
      createdAt: {{ post.date | date_to_xmlschema | jsonify }},
      replies: [
        {% if post.replies %}{% for reply in post.replies %}
        {
          id: {{ post.id | append: '-reply-' | append: forloop.index | jsonify }},
          body: {{ reply.body | jsonify }},
          author: {{ reply.author | jsonify }},
          createdAt: {{ reply.date | date_to_xmlschema | jsonify }}
        }{% unless forloop.last %},{% endunless %}
        {% endfor %}{% endif %}
      ]
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ]

  var forumIndexView = document.querySelector('[data-forum-view="index"]')
  var forumThreadView = document.querySelector('[data-forum-view="thread"]')

  function createId (prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  }

  function generateUsername () {
    return 'User' + String(Math.floor(Math.random() * 9000) + 1000)
  }

  function loadThreads () {
    var storedThreads = []

    try {
      storedThreads = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') || []
    } catch (error) {
      storedThreads = []
    }

    if (!Array.isArray(storedThreads) || storedThreads.length === 0) {
      storedThreads = defaultThreads
      saveThreads(storedThreads)
      return storedThreads
    }

    var hasOnlyLegacySeedThreads = storedThreads.every(function (thread) {
      return typeof thread.id === 'string' && thread.id.indexOf('seed-') === 0
    })

    if (hasOnlyLegacySeedThreads) {
      storedThreads = defaultThreads
      saveThreads(storedThreads)
      return storedThreads
    }

    var userThreads = storedThreads.filter(function (thread) {
      return !(typeof thread.id === 'string' && thread.id.indexOf('seed-') === 0)
    })

    if (userThreads.length !== storedThreads.length) {
      storedThreads = sortThreads(defaultThreads.concat(userThreads))
      saveThreads(storedThreads)
    }

    return storedThreads
  }

  function saveThreads (threads) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
    } catch (error) {
      // If storage is blocked, the forum still works for the current session.
    }
  }

  function sortThreads (threads) {
    return threads.slice().sort(function (left, right) {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
  }

  function findThreadById (threads, threadId) {
    return threads.find(function (thread) {
      return thread.id === threadId
    })
  }

  function formatDate (isoDate) {
    return new Date(isoDate).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function formatTime (isoDate) {
    return new Date(isoDate).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function createMetaBadge (text) {
    var badge = document.createElement('span')
    badge.className = 'forum-badge'
    badge.textContent = text
    return badge
  }

  function createThreadCard (thread) {
    var article = document.createElement('article')
    article.className = 'forum-thread-card'

    var link = document.createElement('a')
    link.className = 'forum-thread-card__link'
    link.href = THREAD_PAGE_URL + '?id=' + encodeURIComponent(thread.id)

    var header = document.createElement('header')
    header.className = 'forum-thread-card__header'

    var title = document.createElement('h3')
    title.className = 'forum-thread-card__title'
    title.textContent = thread.title

    var excerpt = document.createElement('p')
    excerpt.className = 'forum-thread-card__excerpt'
    excerpt.textContent = thread.body

    var meta = document.createElement('div')
    meta.className = 'forum-thread-card__meta'

    meta.appendChild(createMetaBadge(thread.category))

    var author = document.createElement('span')
    author.textContent = thread.author
    meta.appendChild(author)

    var date = document.createElement('span')
    date.textContent = formatDate(thread.createdAt)
    meta.appendChild(date)

    var footer = document.createElement('footer')
    footer.className = 'forum-thread-card__footer'

    var replyCount = document.createElement('span')
    replyCount.className = 'forum-thread-card__count'
    replyCount.textContent = thread.replies.length + ' respuestas'

    var openLabel = document.createElement('span')
    openLabel.className = 'forum-thread-card__action'
    openLabel.textContent = 'Abrir thread'

    footer.appendChild(replyCount)
    footer.appendChild(openLabel)

    header.appendChild(title)
    header.appendChild(excerpt)
    link.appendChild(header)
    link.appendChild(meta)
    link.appendChild(footer)
    article.appendChild(link)

    return article
  }

  function renderStats (threads) {
    var threadTotalElement = document.querySelector('[data-thread-total]')
    var replyTotalElement = document.querySelector('[data-reply-total]')

    if (threadTotalElement) {
      threadTotalElement.textContent = String(threads.length)
    }

    if (replyTotalElement) {
      var replyTotal = threads.reduce(function (total, thread) {
        return total + thread.replies.length
      }, 0)

      replyTotalElement.textContent = String(replyTotal)
    }
  }

  function renderThreadList (threads) {
    var listContainer = document.querySelector('[data-thread-list]')
    var emptyState = document.querySelector('[data-empty-state]')

    if (!listContainer) return

    listContainer.innerHTML = ''

    threads.forEach(function (thread) {
      listContainer.appendChild(createThreadCard(thread))
    })

    if (emptyState) {
      emptyState.classList.toggle('hidden', threads.length !== 0)
    }
  }

  function renderThreadDetail (thread) {
    var detailContainer = document.querySelector('[data-thread-detail]')
    var replyList = document.querySelector('[data-reply-list]')
    var emptyReplies = document.querySelector('[data-empty-replies]')
    var replyForm = document.querySelector('[data-reply-form]')

    if (!detailContainer) return

    detailContainer.innerHTML = ''

    if (!thread) {
      var errorBody = document.createElement('div')
      errorBody.className = 'forum-card__body'

      var errorMessage = document.createElement('p')
      errorMessage.className = 'forum-empty'
      errorMessage.textContent = 'No se encontró este thread. Vuelve al foro para abrir otro.'

      errorBody.appendChild(errorMessage)
      detailContainer.appendChild(errorBody)

      if (replyForm) {
        replyForm.classList.add('hidden')
      }

      if (replyList) {
        replyList.innerHTML = ''
      }

      if (emptyReplies) {
        emptyReplies.classList.add('hidden')
      }

      return
    }

    var header = document.createElement('header')
    header.className = 'forum-thread-detail__header'

    var meta = document.createElement('div')
    meta.className = 'forum-thread-detail__meta'
    meta.appendChild(createMetaBadge(thread.category))

    var author = document.createElement('span')
    author.textContent = thread.author
    meta.appendChild(author)

    var date = document.createElement('span')
    date.textContent = formatDate(thread.createdAt) + ' · ' + formatTime(thread.createdAt)
    meta.appendChild(date)

    var title = document.createElement('h1')
    title.className = 'forum-thread-detail__title'
    title.textContent = thread.title

    var body = document.createElement('p')
    body.className = 'forum-thread-detail__body'
    body.textContent = thread.body

    header.appendChild(meta)
    header.appendChild(title)
    header.appendChild(body)

    var footer = document.createElement('footer')
    footer.className = 'forum-thread-detail__footer'

    var replyCount = document.createElement('span')
    replyCount.textContent = thread.replies.length + ' respuestas guardadas'
    footer.appendChild(replyCount)

    detailContainer.appendChild(header)
    detailContainer.appendChild(footer)

    if (replyForm) {
      replyForm.classList.remove('hidden')
    }

    renderReplyList(thread)
  }

  function createReplyCard (reply) {
    var replyItem = document.createElement('article')
    replyItem.className = 'forum-reply'

    var meta = document.createElement('div')
    meta.className = 'forum-reply__meta'

    var author = document.createElement('strong')
    author.className = 'forum-reply__author'
    author.textContent = reply.author

    var date = document.createElement('time')
    date.className = 'forum-reply__date'
    date.textContent = formatDate(reply.createdAt) + ' · ' + formatTime(reply.createdAt)

    meta.appendChild(author)
    meta.appendChild(date)

    var body = document.createElement('p')
    body.className = 'forum-reply__body'
    body.textContent = reply.body

    replyItem.appendChild(meta)
    replyItem.appendChild(body)

    return replyItem
  }

  function renderReplyList (thread) {
    var replyList = document.querySelector('[data-reply-list]')
    var emptyReplies = document.querySelector('[data-empty-replies]')

    if (!replyList) return

    replyList.innerHTML = ''

    thread.replies.forEach(function (reply) {
      replyList.appendChild(createReplyCard(reply))
    })

    if (emptyReplies) {
      emptyReplies.classList.toggle('hidden', thread.replies.length !== 0)
    }
  }

  function getThreadIdFromLocation () {
    var searchParams = new URLSearchParams(window.location.search)
    return searchParams.get('id')
  }

  function focusFirstInput (form) {
    var firstInput = form.querySelector('input, textarea')

    if (firstInput) {
      firstInput.focus()
    }
  }

  function wireBackButton () {
    var backButton = document.querySelector('[data-forum-back-button]')

    if (!backButton) return

    backButton.addEventListener('click', function () {
      window.location.href = SITE_BASE_URL + '/?cover_collapsed=true'
    })
  }

  function initIndexView () {
    var threads = sortThreads(loadThreads())
    var threadForm = document.querySelector('[data-thread-form]')

    renderStats(threads)
    renderThreadList(threads)

    if (!threadForm) return

    threadForm.addEventListener('submit', function (event) {
      event.preventDefault()

      var formData = new FormData(threadForm)
      var title = String(formData.get('title') || '').trim()
      var category = String(formData.get('category') || '').trim()
      var body = String(formData.get('body') || '').trim()

      if (!title || !category || !body) return

      var updatedThreads = loadThreads()
      var newThread = {
        id: createId('thread'),
        title: title,
        body: body,
        category: category,
        author: generateUsername(),
        createdAt: new Date().toISOString(),
        replies: []
      }

      updatedThreads.push(newThread)
      saveThreads(updatedThreads)

      threadForm.reset()
      window.location.href = THREAD_PAGE_URL + '?id=' + encodeURIComponent(newThread.id)
    })

    focusFirstInput(threadForm)
  }

  function initThreadView () {
    var threadId = getThreadIdFromLocation()
    var threadForm = document.querySelector('[data-reply-form]')
    var threads = loadThreads()
    var thread = threadId ? findThreadById(threads, threadId) : null

    renderStats(threads)
    renderThreadDetail(thread)

    if (!threadForm || !thread) return

    threadForm.addEventListener('submit', function (event) {
      event.preventDefault()

      var formData = new FormData(threadForm)
      var body = String(formData.get('body') || '').trim()

      if (!body) return

      var updatedThreads = loadThreads()
      var activeThread = findThreadById(updatedThreads, threadId)

      if (!activeThread) return

      activeThread.replies.push({
        id: createId('reply'),
        body: body,
        author: generateUsername(),
        createdAt: new Date().toISOString()
      })

      saveThreads(updatedThreads)
      threadForm.reset()

      renderStats(updatedThreads)
      renderThreadDetail(activeThread)
      focusFirstInput(threadForm)
    })

    focusFirstInput(threadForm)
  }

  if (forumIndexView) {
    initIndexView()
  }

  if (forumThreadView) {
    initThreadView()
    wireBackButton()
  }
})()