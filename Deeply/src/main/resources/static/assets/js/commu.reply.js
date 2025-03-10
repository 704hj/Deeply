$(function(){
	/*===========================
	 * 식별자 정의
	 *===========================*/
	let rowCount = 10;
	let currentPage;
	let count;
	
	/*===========================
	 * 댓글 목록
	 *===========================*/	
	//댓글 목록
	function selectList(pageNum){
		currentPage = pageNum;
		//서버와 통신
		$.ajax({
			url:'listReply',
			type:'get',
			data:{c_num:$('#c_num').val(),
				  pageNum:pageNum,rowCount:rowCount},
			dataType:'json',
			beforeSend:function(){
				$('#loading').show();//로딩 이미지 표시
			},
			complete:function(){
				//success와 error 콜백이 호출된 후에 호출
				$('#loading').hide();
			},
			success:function(param){
				count = param.count;
				
				if(pageNum == 1){
					//처음 호출시는 해당 ID의 div의 내부 내용물을
					//제거
					$('#output').empty();
				}
				//댓글수 읽기
				displayReplyCount(param.count);
				
				//댓글 목록 작업
				$(param.list).each(function(index,item){
					//처음에는 보여지지 않고 다음 댓글부터 수평선이
					//보여지게 처리
					if(index>0) $('#output').append('<hr size="1" width="100%">');
					
					let output = '<div class="item">';
					output += '<ul class="detail-info">';
					output += '<li>';
					output += '<img src="../member/viewProfile?user_num='+item.user_num+'" class="my-photo-reply">';			
					output += '</li>';
					output += '<li>';
					output += item.nick_name + '<br>';
					
					if(item.cre_update){
						output += '<span class="modify-date">' + item.cre_update + '</span>';
					}else{
						output += '<span class="modify-date">' + item.cre_date + '</span>';
					}
					output += '</li>';
					output += '</ul>';
					output += '<div class="sub-item">';
					output += '<p>' + item.cre_content.replace(/\r\n/g,'<br>') + '</p>';
					
					if(param.user_num==item.user_num){
						//로그인 한 회원번호와 댓글 작성자 회원번호가 일치
						output += ' <input type="button" data-num="'+item.cre_num+'" value="수정" class="modify-btn">';
						output += ' <input type="button" data-num="'+item.cre_num+'" value="삭제" class="delete-btn">';
					}
					
					//답글 시작
					if(param.user_num){
						output += ' <input type="button" data-num="'+item.cre_num+'" data-parent="0" data-depth="0" value="답글 작성" class="response-btn">';
					}
					if(item.resp_cnt > 0){
						//data-status의 값이 0이면 답글 미표시 상태 1이면 답글 표시 상태
						output += ' <div><input type="button" data-status="0" data-num="'+item.cre_num+'" value="▲ 답글 '+item.resp_cnt+'" class="rescontent-btn"></div>';
					}else{
						output += ' <div><input type="button" data-status="0" data-num="'+item.cre_num+'" value="▲ 답글 0" class="rescontent-btn" style="display:none;"></div>';
					}
					//답글 끝
					
					output += '</div>';
					output += '</div>';
					
					//문서 객체에 추가
					$('#output').append(output);
				});
				//paging button 처리
				if(currentPage >= Math.ceil(count/rowCount)){
					//다음 페이지가 없음
					$('.paging-button').hide();
				}else{
					//다음 페이지가 존재
					$('.paging-button').show();
				}
			},
			error:function(){
				alert('네트워크 오류 발생');
			}	  
		});
	}
	//다음 댓글 보기 버튼 클릭시 데이터 추가
	$('.paging-button input').click(function(){
		selectList(currentPage + 1);
	});
	//댓글 수 표시
	function displayReplyCount(count){
		let output;
		if(count>0){
			output = '댓글수('+count+')';
		}else{
			output = '댓글수(0)';
		}
		//문서 객체에 추가
		$('#output_rcount').text(output);
	}
	
	/*===========================
	 * 댓글 등록
	 *===========================*/
	//댓글 등록
	$('#cre_form').submit(function(event){
		if($('#cre_content').val().trim()==''){
			alert('내용을 입력하세요');
			$('#cre_content').val('').focus();
			return false;
		}
		
		let form_data = $(this).serialize();
		//서버와 통신
		$.ajax({
			url:'writeReply',
			type:'post',
			data:form_data,
			dataType:'json',
			beforeSend:function(xhr){
				xhr.setRequestHeader($('#csrfHeaderName').val(),
			                         $('#csrfTokenValue').val());
			},
			success:function(param){
				if(param.result == 'logout'){
					alert('로그인해야 작성할 수 있습니다.');
				}else if(param.result == 'success'){
					//폼 초기화
					initForm();
					//댓글 작성이 성공하면 새로 삽입한 글을 포함해서
					//첫 번째 페이지의 게시글들을 다시 호출함
					selectList(1);
				}else{
					alert('댓글 등록 오류 발생');
				}
			},
			error:function(){
				alert('네트워크 오류 발생');
			}
		});
		//기본 이벤트 제거
		event.preventDefault();
	});
	//댓글 작성 폼 초기화
	function initForm(){
		$('textarea').val('');
		$('#cre_first .letter-count').text('300/300');
	}
	/*===========================
	 * 댓글 수정
	 *===========================*/
	//댓글 수정 버튼 클릭시 수정폼 노출
	$(document).on('click','.modify-btn',function(){
		//댓글 번호
		let cre_num = $(this).attr('data-num');
		//댓글 내용
		let cre_content = $(this).parent()
		                        .find('p')
								.html()
								.replace(/<br>/gi,'\r\n');
		//댓글 수정폼 UI
		let modifyUI = '<form id="mre_form">';
		modifyUI += '<input type="hidden" name="cre_num" id="cre_num" value="'+cre_num+'">';
		modifyUI += '<textarea rows="3" cols="50" name="cre_content" id="mre_content" class="rep-content">'+cre_content+'</textarea>';						
		modifyUI += '<div id="mre_first"><span class="letter-count">300/300</span></div>';
		modifyUI += '<div id="mre_second" class="align-right">';
		modifyUI += ' <input type="submit" value="수정">';
		modifyUI += ' <input type="button" value="취소" class="re-reset">';
		modifyUI += '</div>';
		modifyUI += '<hr size="1" noshade width="96%">';
		modifyUI += '</form>';
		
		//이전에 이미 수정하는 댓글이 있을 경우 수정버튼을 클릭하면
		//숨김 sub-item를 환원시키고 수정폼을 초기화함
		initModifyForm();
		//지금 클릭해서 수정하고자 하는 데이터는 감추기
		//(수정버튼을 감싸고 있는 div)
		$(this).parent().hide();
		//수정폼을 수정하고자 하는 데이터가 있는 div에 노출
		$(this).parents('.item').append(modifyUI);
		//입력한 글자수 셋팅
		let inputLength = $('#mre_content').val().length;
		let remain = 300 - inputLength;
		remain += '/300';
		//문서 객체에 반영
		$('#mre_first .letter-count').text(remain);
	});
	//수정폼에서 취소 버튼 클릭시 수정폼 초기화
	$(document).on('click','.re-reset',function(){
		initModifyForm();
	});
	//댓글 수정폼 초기화
	function initModifyForm(){
		$('.sub-item').show();
		$('#mre_form').remove();
	}
	//댓글 수정
	$(document).on('submit','#mre_form',function(event){
		if($('#mre_content').val().trim()==''){
			alert('내용을 입력하세요!');
			$('#mre_content').val('').focus();
			return false;
		}
		//폼에 입력한 데이터 반환
		let form_data = $(this).serialize();
		//서버와 통신
		$.ajax({
			url:'updateReply',
			type:'post',
			data:form_data,
			dataType:'json',
			beforeSend:function(xhr){
				xhr.setRequestHeader($('#csrfHeaderName').val(),
			                         $('#csrfTokenValue').val());
			},
			success:function(param){
				if(param.result == 'logout'){
					alert('로그인해야 수정할 수 있습니다.');
				}else if(param.result == 'success'){
					$('#mre_form').parent().find('p')
					              .html($('#mre_content').val()
							                             .replace(/</g,'&lt;')
													     .replace(/>/g,'&gt;')
														 .replace(/\r\n/g,'<br>')
														 .replace(/\r/g,'<br>')
														 .replace(/\n/g,'<br>'));
					//최근 수정일 처리
					$('#mre_form').parent().find('.modify-date')
					                       .text('최근 수정일 : 5초미만');
					//수정폼 초기화
					initModifyForm();					   										 
				}else if(param.result == 'wrongAccess'){
					alert('타인의 글은 수정할 수 없습니다.');
				}else{
					alert('댓글 수정 오류 발생');
				}
			},
			error:function(){
				alert('네트워크 오류 발생');
			}
		});
		
		//기본 이벤트 제거
		event.preventDefault();
	});
	/*===========================
	 * 댓글(답글) 등록, 수정 공통
	 *===========================*/
	//textarea에 내용 입력시 글자수 체크
	$(document).on('keyup','textarea',function(){
		//입력한 글자수 구하기
		let inputLength = $(this).val().length;
		if(inputLength>300){//300자를 넘어선 경우
			$(this).val($(this).val().substring(0,300));
		}else{//300자 이하인 경우
			//남은 글자수 구하기
			let remain = 300 - inputLength;
			remain += '/300';
			if($(this).attr('id')=='cre_content'){
				//댓글 등록 폼 글자수
				$('#cre_first .letter-count').text(remain);
			}else if($(this).attr('id')=='mre_content'){
				//댓글 수정 폼 글자수
				$('#mre_first .letter-count').text(remain);
			}else if($(this).attr('id')=='resp_content'){
				//답글 등록 폼 글자수
				$('#resp_first .letter-count').text(remain);
			}else{
				//답글 수정 폼 글자수
				$('#mresp_first .letter-count').text(remain);
			}
		}
	});
	
	/*===========================
	 * 댓글 삭제
	 *===========================*/
	$(document).on('click','.delete-btn',function(){
		//댓글 번호
		let cre_num = $(this).attr('data-num');
		//서버와 통신
		$.ajax({
			url:'deleteReply',
			type:'get',
			data:{cre_num:cre_num},
			dataType:'json',
			success:function(param){
				if(param.result == 'logout'){
					alert('로그인해야 삭제할 수 있습니다.');
				}else if(param.result == 'success'){
					alert('삭제 완료!');
					selectList(1);
				}else if(param.result == 'wrongAccess'){
					alert('타인의 글을 삭제할 수 없습니다.');
				}else{
					alert('댓글 삭제 오류 발생');
				}
			},
			error:function(){
				alert('네트워크 오류 발생!');
			}
		});
	});
	/*===========================
	 * 답글 등록
	 *===========================*/
	//답글 작성 버튼 클릭시 답글 작성 폼 노출
	$(document).on('click',
	             '.response-btn,.response2-btn',function(){
		//모든 폼을 초기화
		initResponseForm();
		//클릭하면 모든 답글 작성 버튼을 노출시키고 클릭한 답글 작성
		//버튼만 숨기기
		$(this).hide();
		//댓글 번호
		let cre_num = $(this).attr('data-num');
		//부모글 번호
		let pe_parent_num = $(this).attr('data-parent');
		//깊이
		let pe_depth = $(this).attr('data-depth');
		console.log(pe_parent_num+','+pe_depth);
		
		//답글 작성 폼 UI
		let responseUI = '<form id="resp_form">';
		responseUI += '<input type="hidden" name="cre_num" id="resp_num" value="'+cre_num+'">';
		responseUI += '<input type="hidden" name="pe_parent_num" value="'+pe_parent_num+'">';
		responseUI += '<input type="hidden" name="pe_depth" value="'+pe_depth+'">';
		responseUI += '<textarea rows="3" cols="50" name="pe_content" id="resp_content" class="rep-content"></textarea>';						
		responseUI += '<div id="resp_first"><span class="letter-count">300/300</span></div>';
		responseUI += '<div id="resp_second" class="align-right">';
		responseUI += ' <input type="submit" value="등록">';
		responseUI += ' <input type="button" value="취소" class="resp-reset">';
		responseUI += '</div>';
		responseUI += '<hr size="1" noshade width="96%">';
		responseUI += '</form>';
		
		//답글 작성폼을 답글을 작성하고자하는 데이터가 있는 div에 노출
		$(this).after(responseUI);	
	});
	//답글에서 취소 버튼 클릭시 답글폼 초기화
	$(document).on('click','.resp-reset',function(){
		initResponseForm();
	});
	//답글 작성폼 초기화
	function initResponseForm(){
		$('.response-btn,.response2-btn').show();
		$('#resp_form').remove();
	}
	//답글 등록
	$(document).on('submit','#resp_form',function(event){
		let resp_form = $(this);
		
		if($('#resp_content').val().trim()==''){
			alert('내용을 입력하세요!');
			$('#resp_content').val('').focus();
			return false;
		}
		
		//폼에 입력한 데이터 반환
		let form_data = $(this).serialize();
		
		let cre_num = $(this).find('#resp_num').val();
		
		//서버와 통신
		$.ajax({
			url:'writeResponse',
			type:'post',
			data:form_data,
			dataType:'json',
			beforeSend:function(xhr){
				xhr.setRequestHeader($('#csrfHeaderName').val(),
			                         $('#csrfTokenValue').val());
			},
			success:function(param){
				if(param.result=='logout'){
					alert('로그인해야 답글을 작성할 수 있습니다.');
				}else if(param.result=='success'){
					//답글 개수 표시 
					if(resp_form.parent().attr('class')=='sub-item'){
						//답글을 최초 작성시에 .sub-item에 자식으로 form이 생성됨
						//답글을 처음 등록할 때 숨겨져 있는 버튼을 노출함
						resp_form.parent().find('div .rescontent-btn').show();
						resp_form.parent().find('div .rescontent-btn').attr('data-status',1);
						resp_form.parent().find('div .rescontent-btn').val('▼ 답글 ' + (Number(resp_form.parent().find('div .rescontent-btn').val().substring(5)) + 1));				  
					}else{//답글에 답글을 작성할 때
						resp_form.parents('.sub-item').find('div .rescontent-btn').val('▼ 답글 ' + (Number(resp_form.parents('.sub-item').find('div .rescontent-btn').val().substring(5)) + 1));				  
					}
					
					//답글 목록 호출
					getListResponse(
					      cre_num,resp_form.parents('.sub-item'));					
					//폼 초기화
					initResponseForm();
				}else{
					alert('답글 작성 오류 발생');
				}
			},
			error:function(){
				alert('네트워크 오류 발생');
			}
		});		
		//기본 이벤트 제거
		event.preventDefault();
	});
	
	//답글 노출/숨김 버튼 이벤트 처리
	$(document).on('click','.rescontent-btn',function(){
		//data-status의 값이 0이면 답글 미표시 상태 1이면 답글 표시 상태
		if($(this).attr('data-status')==0){
			//0이면 답글 미표시 상태이므로 답글이 있으면 답글을 표시
			//댓글 번호
			let cre_num = $(this).attr('data-num');
			
			//답글 목록 호출          //.sub-item
			getListResponse(cre_num,$(this).parent());
			
			//현재 선택한 내용의 답글 표시 아이콘 토글 처리
			$(this).val($(this).val().replace('▲','▼'));
			$(this).attr('data-status',1);			
		}else{
			//현재 선택한 내용의 답글 표시 아이콘 토글 처리
			$(this).val($(this).val().replace('▼','▲'));
			$(this).attr('data-status',0);
			//현재 선택한 내용 삭제
			$(this).parents('.item').find('.respitem').remove();
		}
	});
	/*===========================
	 * 답글 목록
	 *===========================*/
	function getListResponse(cre_num,responseUI){
		//서버와 통신
		$.ajax({
			url:'listResp',
			type:'get',
			data:{cre_num:cre_num},
			dataType:'json',
			success:function(param){
				//.respitem 존재하면 답글을 모두 지운 후 다시 처리함
				responseUI.find('.respitem').remove();
				
				let output = '';
				$(param.list).each(function(index,item){
					console.log('답글 깊이 : ' + item.pe_depth);
					let sign_depth = '▶';
					for(let i=1;i<item.pe_depth;i++){
						sign_depth += '▶';
					}
					output += '<div class="respitem">';
					output += '<ul class="detail-info">';
					output += '<li>';
					if(item.pe_parent_num>0){
						if(item.pnick_name){
							output += '<b>' + sign_depth + ' ' + item.pnick_name + '</b>';
						}else{
							output += '<b>' + sign_depth + ' ' + item.parent_id + '</b>';
						}
					}
					output += '<img src="../member/viewProfile?user_num='+item.user_num+'" width="30" height="30" class="my-photo">';
					output += '</li>';
					output += '<li>';
					output += item.nick_name + '<br>';
					
					if(item.pe_update){
						output += '<span class="modify-date">' + item.pe_update + '</span>';
					}else{
						output += '<span class="modify-date">' + item.pe_date + '</span>';
					}
					
					output += '</li>';
					output += '</ul>';
					output += '<div class="resp-sub-item">';
					output += '<p>'+item.pe_content.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r\n/g,'<br>').replace(/\r/g,'<br>').replace(/\n/g,'<br>') + '</p>';
					
					if(param.user_num==item.user_num){
						output += ' <input type="button" data-num="'+item.pe_num+'" data-mem="'+item.user_num+'" value="수정" class="resp-modify-btn">';
						output += ' <input type="button" data-num="'+item.pe_num+'" data-mem="'+item.user_num+'" data-rnum="'+item.cre_num+'" value="삭제" class="resp-delete-btn">';
					}
					if(param.user_num){
						output += '  <input type="button" data-num="'+item.cre_num+'" data-parent="'+item.pe_num+'" data-depth="'+(item.pe_depth+1)+'" value="답글 작성" class="response2-btn">';
					}
										
					output += '  </div>';
					output += '</div>';
				});
									
				//답글 노출
				responseUI.append(output);
			},
			error:function(){
				alert('네트워크 오류 발생');
			}
		});
	}
	/*===========================
	 * 답글 수정
	 *===========================*/
	//답글 수정 버튼 클릭시 수정폼 노출
	$(document).on('click','.resp-modify-btn',function(){
		//답글 번호
		let pe_num = $(this).attr('data-num');
		//답글 내용
		let content = $(this).parent().find('p').html()
		                     .replace(/<br>/gi,'\r\n');
		//답글 수정폼 UI
		let modifyUI = '<form id="mresp_form">';
		modifyUI += '<input type="hidden" name="pe_num" id="mresp_num" value="'+pe_num+'">';
		modifyUI += '<textarea rows="3" cols="50" name="pe_content" id="mresp_content" class="rep-content">'+content+'</textarea>';						
		modifyUI += '<div id="mresp_first"><span class="letter-count">300/300</span></div>';
		modifyUI += '<div id="mresp_second" class="align-right">';
		modifyUI += ' <input type="submit" value="수정">';
		modifyUI += ' <input type="button" value="취소" class="mresp-reset">';
		modifyUI += '</div>';
		modifyUI += '<hr size="1" noshade width="96%">';
		modifyUI += '</form>';
		
		//이전에 이미 수정하는 답글이 있을 경우 수정 버튼을 클릭하면
		//숨김 .resp-sub-item를 환원시키고 수정폼을 초기화함
		initResponseModifyForm();
		//지금 클릭해서 수정하고자 하는 데이터는 감추기
		//수정버튼을 감싸고 있는 div
		$(this).parent().hide();
		
		//수정폼을 수정하고자하는 데이터가 있는 div에 노출
		$(this).parents('.respitem').append(modifyUI);
		
		//입력한 글자수 셋팅
		let inputLength = $('#mresp_content').val().length;
		let remain = 300 - inputLength;
		remain += '/300';
		
		//문서 객체에 반영
		$('#mresp_first .letter-count').text(remain);					 
							 
	});
	//답글 수정폼 초기화
	function initResponseModifyForm(){
		$('.resp-sub-item').show();
		$('#mresp_form').remove();
	}
	//답글 수정 취소 버튼 클릭시 답글 수정폼 초기화
	$(document).on('click','.mresp-reset',function(){
		initResponseModifyForm();
	});
	//답글 수정
	$(document).on('submit','#mresp_form',function(event){
		if($('#mresp_content').val().trim()==''){
			alert('내용을 입력하세요!');
			$('#mresp_content').val('').focus();
			return false;
		}
		//폼에 입력한 데이터 반환
		let form_data = $(this).serialize();
		//서버와 통신
		$.ajax({
			url:'updateResponse',
			type:'post',
			data:form_data,
			dataType:'json',
			beforeSend:function(xhr){
				xhr.setRequestHeader($('#csrfHeaderName').val(),
			                         $('#csrfTokenValue').val());
			},
			success:function(param){
				if(param.result=='logout'){
					alert('로그인해야 수정할 수 있습니다.');
				}else if(param.result=='success'){
					$('#mresp_form').parent().find('p')
					                .html($('#mresp_content').val().replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r\n/g,'<br>').replace(/\r/g,'<br>').replace(/\n/g,'<br>'));
					//최근 수정일 처리
					$('#mresp_form').parent().find('.modify-date').text('최근 수정일 : 5초미만');
					//수정폼 초기화
					initResponseModifyForm();
				}else if(param.result=='wrongAccess'){
					alert('타인의 글은 수정할 수 없습니다.');
				}else{
					alert('답글 수정 오류 발생');
				}
			},
			error:function(){
				alert('네트워크 오류 발생');
			}
		});
		//기본 이벤트 제거
		event.preventDefault();
	});	
	/*===========================
	 * 답글 삭제
	 *===========================*/
	$(document).on('click','.resp-delete-btn',function(){
		let resdelete_btn = $(this);
		//댓글 번호
		let cre_num = $(this).attr('data-rnum');
		//답글 번호
		let pe_num = $(this).attr('data-num');
		//작성자 회원번호
		let user_num = $(this).attr('data-mem');
		//서버와 통신
		$.ajax({
			url:'deleteResponse',
			type:'post',
			data:{pe_num:pe_num,user_num:user_num},
			dataType:'json',
			beforeSend:function(xhr){
				xhr.setRequestHeader($('#csrfHeaderName').val(),
			                         $('#csrfTokenValue').val());
			},
			success:function(param){
				if(param.result == 'logout'){
					alert('로그인해야 삭제할 수 있습니다.');
				}else if(param.result == 'success'){
					alert('삭제 완료!');
					//답글 개수 표시
					resdelete_btn.parents('.sub-item')
					             .find('div .rescontent-btn')
								 .val('▼ 답글 ' + param.cnt);
					if(param.cnt>0){
						getListResponse(cre_num,
							resdelete_btn.parents('.sub-item'));
					}else{
						resdelete_btn.parents('.sub-item')
						             .find('div .rescontent-btn').hide();
						$('.respitem').remove();
					}			 
				}else if(param.result == 'wrongAccess'){
					alert('타인의 글을 삭제할 수 없습니다.');
				}else{
					alert('답글 삭제 오류 발생');
				}
			},
			error:function(){
				alert('네트워크 오류 발생');
			}
		});
	});
	/*===========================
	 * 초기 데이터(목록) 호출
	 *===========================*/
	selectList(1);
});
