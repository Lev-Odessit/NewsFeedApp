(function () {
    google.load("visualization", "1", {packages: ["corechart"]});

    var lists = $('td > a'),
        descriptionStr,
        readMore = $('span.read-more'),
        readMoreTitle = $('#3 > h3'),
        getStatistic = $('.get-statistics'),
        dataArrResults,
        newsFeeds = {
            index: window.localStorage.getItem("newsFeeds:index"),
            table: document.getElementById("news-feeds-table"),
            form: document.getElementById("news-feeds-form"),
            buttonDiscard: document.getElementById("news-feeds-op-discard"),

            init: function () {

                newsFeeds.form.reset();
                newsFeeds.buttonDiscard.addEventListener("click", function (event) {
                    newsFeeds.form.reset();
                    newsFeeds.form.id_entry.value = 0;
                }, true);
                newsFeeds.form.addEventListener("submit", function (event) {
                    var entry = {
                        id: parseInt(this.id_entry.value),
                        news_feed_name: this.news_feed_name.value,
                        news_feed_link: this.news_feed_link.value
                    };
                    if (entry.id == 0) { // add
                        newsFeeds.storeAdd(entry);
                        newsFeeds.tableAdd(entry);
                    }
                    else { // edit
                        newsFeeds.storeEdit(entry);
                        newsFeeds.tableEdit(entry);
                    }

                    this.reset();
                    this.id_entry.value = 0;
                    event.preventDefault();
                }, true);

                if (window.localStorage.length - 1) {
                    var news_feeds_list = [], i, key;
                    for (i = 0; i < window.localStorage.length; i++) {
                        key = window.localStorage.key(i);
                        if (/newsFeeds:\d+/.test(key)) {
                            news_feeds_list.push(JSON.parse(window.localStorage.getItem(key)));
                        }
                    }

                    if (news_feeds_list.length) {
                        news_feeds_list
                            .sort(function (a, b) {
                                return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
                            })
                            .forEach(newsFeeds.tableAdd);
                    }
                }
                newsFeeds.table.addEventListener("click", function (event) {
                    var op = event.target.getAttribute("data-op");
                    if (/edit|remove/.test(op)) {
                        var entry = JSON.parse(window.localStorage.getItem("newsFeeds:" + event.target.getAttribute("data-id")));
                        if (op == "edit") {
                            newsFeeds.form.news_feed_name.value = entry.news_feed_name;
                            newsFeeds.form.news_feed_link.value = entry.news_feed_link;
                            newsFeeds.form.id_entry.value = entry.id;
                        }
                        else if (op == "remove") {
                            newsFeeds.storeRemove(entry);
                            newsFeeds.tableRemove(entry);
                        }
                        event.preventDefault();
                    }
                }, true);
            },

            storeAdd: function (entry) {
                entry.id = newsFeeds.index;
                window.localStorage.setItem("newsFeeds:index", ++newsFeeds.index);
                window.localStorage.setItem("newsFeeds:" + entry.id, JSON.stringify(entry));
            },
            storeEdit: function (entry) {
                window.localStorage.setItem("newsFeeds:" + entry.id, JSON.stringify(entry));
            },
            storeRemove: function (entry) {
                window.localStorage.removeItem("newsFeeds:" + entry.id);
            },

            tableAdd: function (entry) {
                var $tr = document.createElement("tr"), $td, $a, key;
                for (key in entry) {
                    if (entry.hasOwnProperty(key)) {
                        $td = document.createElement("td");
                        $a = document.createElement('a');

                        if (key === 'news_feed_link') {
                            $a.setAttribute('href', entry[key]);
                            $a.innerHTML = 'Последние сообщения канала';
                            $td.appendChild($a);
                            $tr.appendChild($td);
                        } else {
                            $td.appendChild(document.createTextNode(entry[key]));
                            $tr.appendChild($td);
                        }

                    }
                }
                $td = document.createElement("td");
                $td.innerHTML = '<a data-op="edit" data-id="' + entry.id + '">Редактировать</a> | <a data-op="remove" data-id="' + entry.id + '">Удалить</a>';
                $tr.appendChild($td);
                $tr.setAttribute("id", "entry-" + entry.id);
                newsFeeds.table.appendChild($tr);
            },
            tableEdit: function (entry) {
                var $tr = document.getElementById("entry-" + entry.id), $td,$a, key;
                $tr.innerHTML = "";
                for (key in entry) {
                    $td = document.createElement("td");
                    $a = document.createElement('a');

                    if (key === 'news_feed_link') {
                        $a.setAttribute('href', entry[key]);
                        $a.innerHTML = 'Последние сообщения канала';
                        $td.appendChild($a);
                        $tr.appendChild($td);
                    } else {
                        $td.appendChild(document.createTextNode(entry[key]));
                        $tr.appendChild($td);
                    }
                }
                $td = document.createElement("td");
                $td.innerHTML = '<a data-op="edit" data-id="' + entry.id + '">Редактировать</a> | <a data-op="remove" data-id="' + entry.id + '">Удалить</a>';
                $tr.appendChild($td);
            },
            tableRemove: function (entry) {
                newsFeeds.table.removeChild(document.getElementById("entry-" + entry.id));
                window.localStorage.setItem("newsFeeds:index", --newsFeeds.index);
            },
            showPosts: function (event) {
                var objUrl = event.target.href,
                    newsPosts = $('.news-posts'),
                    query = "select * from feed where url='" + objUrl + "' LIMIT 5",
                    url = "http://query.yahooapis.com/v1/public/yql?q=" + encodeURIComponent(query) + "&format=json&callback=?";

                $.getJSON(url, function (data) {

                    newsPosts.empty();

                    getCountOfPosts(data);
                    getDataResults(data.query.results);

                    $.each(data.query.results.item || data.query.results.entry, function () {

                        newsPosts.append(getPost(this));

                        setPostNumberAttr();

                    });

                });

            }

        };

    lists.live('click', function (event) {
        var contentSection = $('#context');

        getStatistic.hide();

        newsFeeds.showPosts(event);

        readMoreTitle.empty();
        contentSection.empty();

        event.preventDefault();

    });

    readMore.live('click', function (postsArray) {
        var thisPostNumber = $(this).attr('post-number'),
            contentSection = $('#context');

        readMoreTitle.empty();
        contentSection.empty();

        readMoreTitle.append(dataArrResults.item[thisPostNumber].title);

        contentSection.append(dataArrResults.item[thisPostNumber].description);

        contentSection.append(dataArrResults.item[thisPostNumber].fulltext);

        contentSection.append(dataArrResults.item[thisPostNumber].encoded);

        contentSection.append(dataArrResults.item[thisPostNumber].creator);

        descriptionStr = dataArrResults.item[thisPostNumber].description + dataArrResults.item[thisPostNumber].fulltext;

        console.dir(descriptionStr);

        getEnglishLettersStatistics(descriptionStr);

    });

    getStatistic.live('click', function () {

            var context = document.getElementById('context');

            console.dir(context);

    });

    function getCountOfPosts(param) {

        var countSpan = $('.content-counts span'),
            countOfPosts = param.query.count;

        countSpan.empty();

        countSpan.append(countOfPosts);

    }

    function getPost(item) {

        return $('<div>').html(item.title + ' <span class="read-more">Read here</span>' + ' <a href="' + (item.origLink || item.link[0].href || item.link) + '" target="_blank">Read more</a>');

    }

    function setPostNumberAttr() {

        $("div.news-posts span.read-more").each(function (index) {
            $(this).attr('post-number', index);
        });

    }

    function getDataResults(data) {
        dataArrResults = data;
    }

    function getEnglishLettersStatistics(descriptionStr) {
        var lowerCaseStr = descriptionStr.toLowerCase(),
            strWithoutGaps = lowerCaseStr.replace(/([\s0-9.*+;',"_’#а-я<>?^=!:${}()|\[\]\/\\\-])/g, ''),
            lettersArr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
            lettersCountArr = [],
            letterPercent = [],
            total,
            data,
            options,
            chart;

        letterPercent.push(['Буква', 'Частота появления']);

        for (var i = 0; i < lettersArr.length; i += 1) {
            total = --strWithoutGaps.split(lettersArr[i]).length;
            lettersCountArr[i] = [lettersArr[i], +total];
            letterPercent.push(lettersCountArr[i]);
        }

        data = google.visualization.arrayToDataTable(letterPercent,false);

        options = {
            title: 'Статистика латинских букв',
            is3D: true,
            pieResidueSliceLabel: 'Остальное'
        };

        chart = new google.visualization.PieChart(
            document.getElementById('air')
        );
        chart.draw(data, options);
    }

    newsFeeds.init();

}());





