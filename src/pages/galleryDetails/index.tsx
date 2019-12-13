import Taro, { Component, Config } from "@tarojs/taro";
import { ScrollView, View, Image, Button, Text } from "@tarojs/components";
import {
  AtSearchBar,
  AtMessage,
  AtModalHeader,
  AtModalContent,
  AtModalAction,
  AtModal,
  AtLoadMore,
  AtFab
} from "taro-ui";
import { getImagesByAlbumID } from "../../api/gallery";
import { lazyLoad } from "../../utils/public";
import "./index.scss";

interface IProps {}
interface IState {
  id: string;
  showReLogin: boolean;
  isClose: boolean;
  isPre: boolean;
  title: string;
  status: "loading" | "noMore" | "more" | undefined;
  value: string;
  photos: any[];
  allPhotosUrl: string[];
  timer: any;
  url: string;
  scrollViewHeight: number;
  loadData: {
    allArr: any[];
    loadArr: any[];
    index: number;
    long: number;
    finished: boolean;
  };
}

export default class GalleryDetails extends Component<IProps, IState> {
  config: Config = {
    navigationBarTitleText: "相册",
    backgroundTextStyle: "dark",
    enablePullDownRefresh: true,
    onReachBottomDistance: 150
  };
  static options = {
    addGlobalClass: true
  };
  constructor(props: IProps) {
    super(props);
    this.state = {
      id: "",
      showReLogin: false,
      isClose: true,
      isPre: false,
      scrollViewHeight: 0,
      title: "",
      status: "loading",
      value: "",
      url: "https://image.2077tech.com/",
      photos: [],
      allPhotosUrl: [],
      timer: null,
      loadData: {
        allArr: [],
        loadArr: [],
        index: 0,
        long: 50,
        finished: false
      }
    };
  }
  componentDidMount() {
    const { id, title } = this.$router.params;
    const query = Taro.createSelectorQuery();
    query.select("#search").boundingClientRect();
    query.exec(res => {
      //res就是 所有标签为mjltest的元素的信息 的数组
      this.setState({
        id,
        title,
        isClose: false,
        scrollViewHeight:
          Taro.getSystemInfoSync().windowHeight -
          res.find(item => item.id === "search").height
      });
    });
    this.getAllImages(id);

    Taro.setNavigationBarTitle({
      title
    });
  }
  onPullDownRefresh() {
    // 下拉开始
    this.getAllImages(this.state.id, true);
  }
  getAllImages(id: string, refresh: boolean = false) {
    Taro.atMessage({
      message: "时光机加载中，请稍后！",
      type: "info"
    });
    const { timer, url } = this.state;
    clearInterval(timer);
    getImagesByAlbumID(id)
      .then(res => {
        if (res.data.photos === undefined) {
          this.setState({
            showReLogin: true
          });
          return false;
        }
        let photos = [];
        if (res.data.photos !== false) {
          photos = res.data.photos.map(photo => ({
            thumbUrl: photo.thumbUrl,
            url: photo.url,
            showClassName: true
          }));
        }
        let obj = {
          ...this.state.loadData,
          allArr: photos
        };
        if (refresh) {
          obj.loadArr = [];
        }
        const loadData = lazyLoad(obj);
        this.setState(
          {
            loadData,
            photos: loadData.loadArr,
            allPhotosUrl: photos.map(photo => `${url}${photo["url"]}`)
          },
          () => {
            this.handleLoadMore();
          }
        );
        Taro.stopPullDownRefresh();

        Taro.atMessage({
          message: "欢迎来到刘家大院！",
          type: "success"
        });
      })
      .catch(err => {
        Taro.atMessage({
          message: `加载失败！${err}`,
          type: "error"
        });
      });
  }
  componentDidShow(): void {
    const { isPre, isClose, id } = this.state;
    if (!isClose && !isPre) {
      this.getAllImages(id, true);
    }
    if (isPre) {
      this.setState({
        isPre: false
      });
    }
  }

  handleReLogin() {
    Taro.reLaunch({
      url: "/pages/index/index"
    });
  }
  handleClickImage(photo) {
    const { url } = this.state;
    this.setState({
      isPre: true
    });
    Taro.previewImage({
      current: `${url}${photo.url}`, // 当前显示图片的http链接
      urls: this.state.allPhotosUrl // 需要预览的图片http链接列表
    });
  }
  onChangeSearch(value: string) {
    this.setState({
      value
    });
  }
  onActionClick() {}
  handleLoadMore() {
    const { loadData } = this.state;
    if (loadData.finished) {
      this.setState({
        status: "noMore"
      });
    } else {
      this.setState({
        photos: lazyLoad(loadData).loadArr
      });
    }
  }
  handleAddAlbum() {
    const { id, title } = this.state;
    Taro.navigateTo({
      url: `/pages/addPhotos/index?id=${id}&title=${title}`
    });
  }
  render() {
    const { photos, url, showReLogin, status, scrollViewHeight } = this.state;
    return (
      <View>
        <AtMessage />
        <View id="search">
          <AtSearchBar
            placeholder="后续添加搜索功能"
            actionName="搜索"
            value={this.state.value}
            onChange={this.onChangeSearch.bind(this)}
            onActionClick={this.onActionClick.bind(this)}
          />
        </View>
        <ScrollView
          scrollY={true}
          lowerThreshold={100}
          scrollWithAnimation={true}
          onScrollToLower={this.handleLoadMore.bind(this)}
          style={`height:${scrollViewHeight}px`}
        >
          <View className="at-row at-row--wrap">
            {photos.map((photo, index) => {
              return (
                <View
                  className="at-col galleryItems zoomInDown animated"
                  key={index}
                  onClick={this.handleClickImage.bind(this, photo)}
                >
                  <Image
                    mode="aspectFill"
                    style="width:100%;height:100%;"
                    src={`${url}${photo.thumbUrl}`}
                    lazyLoad
                  />
                </View>
              );
            })}
          </View>
          <AtLoadMore status={status} />
        </ScrollView>
        <AtModal isOpened={showReLogin}>
          <AtModalHeader>提示</AtModalHeader>
          <AtModalContent>登录失效，请重新登录！</AtModalContent>
          <AtModalAction>
            <Button onClick={this.handleReLogin}>确定</Button>
          </AtModalAction>
        </AtModal>
        <View className="fab-box">
          <AtFab>
            <Text
              className="at-fab__icon at-icon at-icon-add-circle"
              onClick={this.handleAddAlbum.bind(this)}
            />
          </AtFab>
        </View>
      </View>
    );
  }
}