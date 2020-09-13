import request from '@/utils/request'

export function query(query) {
  return request({
    url: '/server/worker/query',
    method: 'get',
    params: query
  })
}

export function create(data) {
  return request({
    url: '/server/worker/create',
    method: 'post',
    data
  })
}

export function update(data) {
  return request({
    url: '/server/worker/update',
    method: 'post',
    data
  })
}

export function del(id) {
  return request({
    url: '/server/worker/delete/'+id,
    method: 'delete'
  })
}