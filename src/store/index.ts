import Vue from "vue";
import Vuex from "vuex";
import Node from "../types/Node";
import ScreenPosition from '@/types/ScreenPosition';
import Line from '@/types/Line';
import Data from '@/types/Data';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    nodes: Array<Node>(),

    selectionActive: Boolean,
    selectionStartPos: ScreenPosition,
    selectionEndPos: ScreenPosition,

    zoom: Number
  },

  mutations: {
    fakeInit(state){
      let fakeNode = new Node("Test Node 1", new ScreenPosition(150, 150));
      fakeNode.addLine();
      fakeNode.addColumn();
      fakeNode.addColumn();
      fakeNode.addLine();

      let fakeNode2 = new Node("Test Node 2", new ScreenPosition(1200, 350));      
      fakeNode2.addLine();

      state.nodes.push(fakeNode);
      state.nodes.push(fakeNode2);
    },

    addNode(state, payload){
      let newNode = new Node("New node", payload as ScreenPosition);
      state.nodes.push(newNode);
    },
    deleteNode(state, payload){
      state.nodes.splice(payload, 1);
    },
    copyNode(state, payload){
      let existingNode = state.nodes[payload.index] as Node;
      
      let newScreenPostion = new ScreenPosition(existingNode.position.x + (50 * payload.count), existingNode.position.y + (50 * payload.count));

      let nodeCopy = new Node(existingNode.title + " - copy", newScreenPostion);
      
      let copiedLines = new Array<Line>();
      for (let i = 0; i < existingNode.lines.length; i++) {
        let line = existingNode.lines[i];

        let newLine = new Line(line.data.length);
        let copiedData = new Array<Data>();

        for (let j = 0; j < line.data.length; j++) {
          copiedData.push(Object.assign({}, line.data[j]));
        }

        newLine.data = copiedData;
        copiedLines.push(newLine);
      }

      nodeCopy.setLines(copiedLines);

      state.nodes.push(nodeCopy);
    },

    updateNodeTitle(state, payload){
      let node = state.nodes[payload.index];
      node.title = payload.value;

      state.nodes[payload.index] = node;
    },

    addLineToNode(state, payload){
      state.nodes[payload].addLine();
    },
    addColumnToNode(state, payload){
      state.nodes[payload].addColumn();
    },

    editDataCell(state, payload){
      let node = state.nodes[payload.index];
      let line = node.lines[payload.line];
      let data = line.data[payload.column];

      data.value = payload.value;
    },

    moveNodeToPosition(state, payload){
      let node = state.nodes[payload.index];
      node.moveToPosition(payload.newPosition as ScreenPosition);
      state.nodes[payload.index] = node;
    },

    setSelectionStartPosition(state, payload){
      state.selectionActive = payload.active;
      state.selectionStartPos = payload.pos;
    },
    setSelectionEndPosition(state, payload){
      state.selectionEndPos = payload;
    },
    deactivateSelection(state, payload){
      state.selectionActive = payload.active;
      state.selectionStartPos = payload.pos;
      state.selectionEndPos = payload.pos;
    },

    setZoom(state, payload){
      state.zoom = payload;
    },
    resetZoom(state, payload){
      state.zoom = payload;
    }
  },

  actions: {

  },

  modules: {

  }
});