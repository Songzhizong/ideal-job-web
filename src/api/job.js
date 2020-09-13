import request from '@/utils/request'

export function query(query) {
  const data = query
  return request({
    url: '/server/job/query',
    method: 'post',
    params: {
      page: query.page,
      size: query.size
    },
    data
  })
}

export function create(data) {
  return request({
    url: '/server/job/create',
    method: 'post',
    data
  })
}

export function update(data) {
  return request({
    url: '/server/job/update',
    method: 'post',
    data
  })
}

export function remove(id) {
  return request({
    url: '/server/job/remove/' + id,
    method: 'delete'
  })
}

export function enable(id) {
  return request({
    url: '/server/job/enable/' + id,
    method: 'put'
  })
}

export function disable(id) {
  return request({
    url: '/server/job/disable/' + id,
    method: 'put'
  })
}

export function trigger(id, data) {
  return request({
    url: '/server/job/trigger/' + id,
    method: 'post',
    data
  })
}
