import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/server/user/login',
    method: 'post',
    data
  })
  // return {
  //   code: 20000,
  //   data: {
  //     token: 'admin-token'
  //   }
  // }
}

export function getInfo(token) {
  return request({
    url: '/server/user/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/server/user/logout',
    method: 'post'
  })
}
