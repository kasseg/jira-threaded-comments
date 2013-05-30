function RearrangeComments() {
    var issueID = JIRA.Issue.getIssueId();
    var parents = {};
    AJS.$.getJSON(AJS.contextPath() + "/rest/handlecomments/latest/commentdata?issueid=" + issueID, function (data) {
        $.each(data, function () {
            //console.log(this.commentid);
            parents[this.commentid] = this.parentcommentid;
        });
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function () {
            var commentId = AJS.$(this).attr('id').split('-')[1];

            var parent = parents[commentId];
            //console.log(commentId);
            if (parent) {
                var parentId = '#comment-' + parent;
                if (AJS.$(parentId).length != 0) {
                    //console.log("found parent in dom");
                    AJS.$(this).addClass('movedcomment');
                    AJS.$(this).appendTo(parentId);
                }
            }
            else {
                //console.log("no parent found for " + commentId);
            }
        });
    });
}

function AddCommentButtons() {
    var loggedInUser = AJS.Meta.get('remote-user');
    var issueID = JIRA.Issue.getIssueId();
    var issueKey = AJS.Meta.get('issue-key');

    console.log("AddCommentButtons called - " + issueID);

    /*    var securityInfo = AJS.$('<a href="#visibility" aria-owns="visibility" aria-haspopup="true" class="aui-button aui-dropdown2-trigger aui-style-default">Visibility</a></p> \
     <div id="visibility" class="aui-dropdown2 aui-style-default">                                                                                      \
     <div class="aui-dropdown2-section">                                                                                                                \
     <strong>Groups</strong>                                                                                                                        \
     <ul>                                                                                                                                           \
     \
     </ul>                                                                                                                                          \
     </div>                                                                                                                                             \
     <div class="aui-dropdown2-section">                                                                                                                \
     <strong>Project Roles</strong>                                                                                                                     \
     <ul>                                                                                                                                               \
     </ul>                                                                                                                                                  \
     </div>                                                                                                                                                 \
     </div>');*/


    /*
     AJS.$.getJSON(AJS.contextPath() + '/rest/api/latest/groupuserpicker?query=' + AJS.params.loggedInUser, function(data){
     //console.log(data.groups.groups);
     AJS.$.each(data.groups.groups, function(key, value){
     securityInfo.find('.aui-dropdown2-section:first').find('ul').append('<li><a href="#foo">' + value.html + '</a></li>');
     console.log(value.html);
     console.log(securityInfo);
     });
     });

     AJS.$.getJSON(AJS.contextPath() + '/rest/api/latest/project/' + 'DEMO' + '/role', function(data){
     //console.log(data.groups.groups);
     AJS.$.each(data, function(key, value){
     securityInfo.find('.aui-dropdown2-section:last').find('ul').append('<li><a href="#">' + value + '</a></li>');
     console.log(value.html);
     console.log(securityInfo);
     });
     });
     */

    AJS.$.getJSON(AJS.contextPath() + "/rest/api/latest/issue/" + issueKey, function (data) {
        var projectKey = data.fields.project.key;
        AJS.$('div[id|=comment][id!=comment-wiki-edit]').each(function () {
            var commentWholeId = AJS.$(this).attr('id');
            var commentId = AJS.$(this).attr('id').split('-')[1];

            var commentBlock = AJS.$(this).children()[0];
            if (AJS.$(commentBlock).find('.commentreply').length == 0) {
                console.log("Adding Reply block and handler for commentId - " + commentId);
                AJS.$(commentBlock).append(AJS.$('<a class="commentreply" href="#">Reply</a>'));
                AJS.$(commentBlock).append(AJS.$('<div class="commentreplyarea">' +
                    '<textarea class="textcommentreply textarea long-field wiki-textfield mentionable" cols="60" rows="10" wrap="virtual" ' +
                    'data-projectkey="' + projectKey + '" data-issuekey="' + issueKey + '" style="overflow-y: auto; height: 200px;"></textarea>' +
                    '<ul class="ops">' +
                    '<li><a data="' + commentId + '" class="aui-button replycommentbutton">Add</a></li>' +
                    '<li><a href="#" data="' + commentId + '" class="aui-button aui-button-link cancel replycommentcancel">Cancel</a></li>' +
                    '<span class="icon throbber loading hiddenthrobber"></span>' +
                    '</ul>' +
                    '</div><br/>'));
                //AJS.$(commentBlock).append(securityInfo.clone(true));

                AJS.$(this).find('.commentreply').click(function () {
                    event.preventDefault();
                    AJS.$('.commentreplyarea').hide();
                    AJS.$('.commentreply').show();
                    AJS.$(this).next().toggle();
                    AJS.$(this).hide();
                });
                AJS.$(this).find('.replycommentbutton').click(function () {
                    var newComment = AJS.$(this).parent().parent().parent().children("textarea").val();
                    if (newComment.length == 0) {
                        console.log("empty input");
                        return;
                    }
                    AJS.$(this).find('.hiddenthrobber').show();
                    var encoded = AJS.$('<div/>').text(newComment).html();
                    var postData = {};
                    postData.commentbody = newComment;
                    postData.parentcommentid = AJS.$(this).attr('data');
                    postData.issueid = issueID;

                    //console.log("new data " + postData);
                    AJS.$.ajax({
                        url: AJS.contextPath() + "/rest/handlecomments/latest/addcomment",
                        data: JSON.stringify(postData),
                        type: "POST",
                        contentType: "application/json",
                        success: function (data) {
                            console.log("New comment added :" + data);
                            JIRA.trigger(JIRA.Events.REFRESH_ISSUE_PAGE, [JIRA.Issue.getIssueId(), {
                                complete: function () {
                                    AJS.$("#comment-" + data.commentid).scrollIntoView({marginBottom: 200, marginTop: 200});
                                    AJS.$("#comment-" + data.commentid).addClass('focused');
                                }
                            }]);
                            AJS.$(this).find('.hiddenthrobber').hide();
                        }
                    });
                });
                AJS.$(this).find('.replycommentcancel').click(function () {
                    event.preventDefault();
                    AJS.$(this).parent().parent().parent().toggle();
                    //AJS.$(this).closest('.commentreplyarea').show();
                    AJS.$(this).closest('.issue-data-block').find('.commentreply').show();
                });
            }
        });
    });

}

AJS.$('document').ready(function () {
    AddCommentButtons();
    RearrangeComments();
    JIRA.ViewIssueTabs.onTabReady(function () {
        AddCommentButtons();
        RearrangeComments();
    });
    JIRA.bind(JIRA.Events.REFRESH_ISSUE_PAGE, function (e, context, reason) {
        RearrangeComments();
        AddCommentButtons();
    });
});