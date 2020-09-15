import request from '@/utils/request'

export function query(query) {
  const data = query
  return request({
    url: '/server/job/instance/queryVo',
    method: 'post',
    params: {
      page: query.page,
      size: query.size
    },
    data
  })
}
