<template>
  <div id="app" @contextmenu.prevent="displayContextualMenu($event)" @mouseup="handleMouseUp()"
                @mousemove="handleMouseMove($event)" @mousedown.shift.left="startSelection($event)" @mousedown.exact="handleMouseDown()">
    <!-- <SelectionBox v-if="displaySelectionBox" :end="endSelectionTemporaryPos"/> -->
    <ContextualMenu ref="contextualMenu" @add-node="addNode($event)"/>
    <ToolMenu ref="toolMenu"/>

    <div id="viewport" ref="viewport" @mousedown.left="startPanning($event)" @mousewheel.prevent="zoomOnMousePosition($event)" @click.middle="resetZoom($event)">
      <div id="view" ref="view">
        <AppNode v-for="(node, index) in nodes" :key="node.title + '_' + index" :node="node" :index="index"
                 @drag-node="startGrabbingNode($event)" :shadow="index === grabbingNodeIndex"/>
        <AppNode v-if="grabbingNodeIndex != -1" :node="grabbedNodeShadow" :index="1000" class="grabbed"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";



//MODULES
import { Component, Vue, Watch } from "vue-property-decorator";

/*COMPONENTS*/
import AppNode from "./components/AppNode.vue";
import ContextualMenu from "./components/ContextualMenu.vue";
import ToolMenu from "./components/ToolMenu.vue";
import SelectionBox from "./components/SelectionBox.vue";

/*MODELS*/
import Node from "./types/Node";
import ScreenPosition from './types/ScreenPosition';

@Component({
  components: {
    AppNode,
    ContextualMenu,
    ToolMenu,
    SelectionBox
  }
})
export default class App extends Vue {  
  $refs!:{
    contextualMenu: ContextualMenu,
    toolMenu: ToolMenu,
    view: HTMLElement,
    viewport: HTMLElement
  }

  grabbingNodeIndex: number = -1;
  grabbedNodeShadow: Node = new Node("Shadow node", new ScreenPosition(0,0));

  displaySelectionBox: Boolean = false;
  selectionActive: Boolean = false;

  endSelectionTemporaryPos: ScreenPosition = new ScreenPosition(0,0);

  private isPanning: Boolean = false;
  private lastMouseX!: number;
  private lastMouseY!: number;

  private deltaMouseX!: number;
  private deltaMouseY!: number;

  private zoomFactor: number = 0.08;
  private zoomMax: number = 1.5;
  private zoomMin: number = 0.5;

  //Initiate the application by fetching data from store
  mounted(){
    this.$store.commit("setZoom", 1);
    this.$store.commit('fakeInit');
  }

  //Handle pad effect
  startPanning(event:MouseEvent):void{
    let domTarget = event.target as HTMLElement;

    if(domTarget.id === "viewport" || domTarget.id === "view"){
      this.isPanning = true;

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }
  stopPanning():void{
    this.isPanning = false;
  }
  pan(event: MouseEvent):void{
    if(this.isPanning){
      var deltaX = this.lastMouseX - event.clientX;
      var deltaY = this.lastMouseY - event.clientY;

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;

      let left = parseFloat(this.$refs.view.style.left as string);
      let top = parseFloat(this.$refs.view.style.top as string);

      left = isNaN(left) ? 0 : left;
      top = isNaN(top) ? 0 : top;

      left -= deltaX / this.zoom;
      top -= deltaY / this.zoom;

      this.$refs.view.style.left = left.toString() + "px";
      this.$refs.view.style.top = top.toString() + "px";
    }
  }

  //Handle node grab effect
  startGrabbingNode(event: any): void{
    this.grabbingNodeIndex = event.index;

    this.grabbedNodeShadow = JSON.parse(JSON.stringify(this.nodes[this.grabbingNodeIndex]));

    this.deltaMouseX = (event.mousePosition.x / this.zoom) - this.grabbedNodeShadow.position.x;
    this.deltaMouseY = (event.mousePosition.y / this.zoom) - this.grabbedNodeShadow.position.y;
  }
  moveGrabbedNode(event: MouseEvent): void{
    if(this.grabbingNodeIndex != -1){
      let x = (event.x / this.zoom) - this.deltaMouseX;
      let y = (event.y / this.zoom) - this.deltaMouseY;

      this.grabbedNodeShadow.position.x = x;
      this.grabbedNodeShadow.position.y = y;      
    }
  }
  stopGrabbing(): void{
    if(this.grabbingNodeIndex != -1){
      this.$store.commit("moveNodeToPosition", {
        index: this.grabbingNodeIndex,
        newPosition: this.grabbedNodeShadow.position
      })
    }
    this.grabbingNodeIndex = -1;
  }  

  //Handle global mouse events
  handleMouseUp(): void{
    this.stopPanning();
    this.stopGrabbing();
    this.stopSelection();
  }
  handleMouseMove(event: MouseEvent):void{
    if(this.displaySelectionBox){
      this.updateSelectionBox(event);
    } else{
      this.moveGrabbedNode(event);
      this.pan(event);
    }
  }
  handleMouseDown(){
    if(this.selectionActive){
      this.selectionActive = false;
      this.deactivateSelection();
    }
  }

  //Handle zoom
  zoomOnMousePosition(event: MouseWheelEvent): void{
    let sign = event.deltaY > 0 ? -1 : 1;
    let zoomTemp = this.zoom + sign * this.zoomFactor;

    if(zoomTemp > this.zoomMax){
      zoomTemp = this.zoomMax;
    }
    else if(zoomTemp < this.zoomMin){
      zoomTemp = this.zoomMin;
    }

    this.$store.commit("setZoom", zoomTemp);

    ///trying to center the zoom effect on mouse position
    ///not very successful so far
    // let left = parseFloat(this.$refs.view.style.left as string);
    // let top = parseFloat(this.$refs.view.style.top as string);

    // left = isNaN(left) ? 0 : left;
    // top = isNaN(top) ? 0 : top;

    // // Calculate displacement of zooming position.
    // let dx = (event.clientX - left) / this.zoom;
    // let dy = (event.clientY - top) / this.zoom;

    // // Compensate for displacement.
    // this.$refs.view.style.left = (dx -event.clientX) + "px";
    // this.$refs.view.style.top = (dy - event.clientY) + "px";
  }
  resetZoom(event: MouseEvent):void{
    this.$store.commit("resetZoom", 1);
  }

  startSelection(event: MouseEvent):void{
    return;

    // this.deactivateSelection();

    // this.selectionActive = true;
    // this.displaySelectionBox = true;

    // let pos = new ScreenPosition(event.clientX, event.clientY);

    // this.$store.commit("setSelectionStartPosition", {
    //   pos: pos,
    //   active: this.selectionActive
    // });
    // this.endSelectionTemporaryPos = pos;
  }
  updateSelectionBox(event: MouseEvent):void{
    if(this.displaySelectionBox){
      this.endSelectionTemporaryPos = new ScreenPosition(event.clientX, event.clientY);
    }
  }
  stopSelection():void{
    if(this.displaySelectionBox){
      this.displaySelectionBox = false;
      this.$store.commit("setSelectionEndPosition", this.endSelectionTemporaryPos);
    }
  }
  deactivateSelection():void{
    this.$store.commit("deactivateSelection",{
      active: this.selectionActive,
      pos: null
    });
  }

  //Display contextual menu
  displayContextualMenu(event: MouseEvent): void{
    this.$refs.contextualMenu.show(event);
    this.stopGrabbing();
    this.stopPanning();
  }
  addNode(payload: ScreenPosition): void{
    this.$store.commit("addNode", payload.divide(this.zoom));
  }

  //COMPUTED GETTERS
  get zoom(): number{
    return this.$store.state.zoom;
  }
  get nodes(): Array<Node>{
    let nodes = this.$store.state.nodes;
    return nodes;
  }

  @Watch('zoom')
  onZoomChanged(){
    this.$refs.viewport.style.zoom = this.zoom.toString();
  }
}
</script>

<style>
body {
  background-color: white;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin:0;
  padding:0;
}

#app{
  width: 100vw;
  height: 100vh;
}

#viewport{
  width:100%;
  height:100%;
  overflow: hidden;
  display: block;
  background-color: transparent;
}

#view {
  position: relative;
  width: 100%;
  height: 100%;
  top:0px;
  left:0px;
  z-index: 0;
}
</style>
