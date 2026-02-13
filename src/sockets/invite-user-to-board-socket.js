// Param socket sẽ được lấy từ thư viện socket.io
export const inviteUserToBoardSocket = (socket) => {
  // Lắng nghe sự kiện mà Client emit lên có tên là: FE_USER_INVITED_TO_BOARD
  socket.on('FE_USER_INVITED_TO_BOARD', (data) => {
    console.log('data: ', data)
    // Cách làm nhanh & đơn giản nhất: Emit ngược lại một sự kiện về cho mọi client khác (ngoại trừ chính cái
    // thằng gửi request lên), rồi để phía FE check
    /**
       * socket.broadcast.emit('hi'):
       * - socket.emit('hi'): gửi event 'hi' CHỈ cho chính client đã gửi request
       * - io.emit('hi'): gửi event 'hi' cho TẤT CẢ client đang kết nối (bao gồm cả người gửi)
       * - socket.broadcast.emit('hi'): gửi event 'hi' cho TẤT CẢ client NGOẠI TRỪ người gửi
       *   => Dùng broadcast ở đây vì người invite đã biết mình invite rồi, chỉ cần thông báo cho các user khác
       */
    socket.emit('BE_USER_INVITED_TO_BOARD', data)
  })
}
